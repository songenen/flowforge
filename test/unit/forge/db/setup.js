const fastify = require('fastify')
const FF_UTIL = require('flowforge-test-utils')
const db = FF_UTIL.require('forge/db')
const postoffice = FF_UTIL.require('forge/postoffice')
const { Roles } = FF_UTIL.require('forge/lib/roles')

module.exports = async function (settings = {}, config = {}) {
    const app = fastify()

    config = {
        ...config,
        db: {
            type: 'sqlite',
            storage: ':memory:'
        },
        email: {
            enabled: true
        }
    }

    // Quick fix - need a better strategry for per-test settings
    app.decorate('settings', { get: (key) => settings[key] })
    app.decorate('config', config)

    // {
    //     //
    // })
    await app.register(db)
    await app.register(postoffice)

    /*
        alice (admin)
        bob
        chris (!email_verified)

        ATeam - alice(owner), bob(member)
        BTeam - bob(owner), alice(member)
        CTeam - alice(owner)
    */
    await app.db.models.PlatformSettings.upsert({ key: 'setup:initialised', value: true })
    const userAlice = await app.db.models.User.create({ admin: true, username: 'alice', name: 'Alice Skywalker', email: 'alice@example.com', email_verified: true, password: 'aaPassword' })
    const userBob = await app.db.models.User.create({ username: 'bob', name: 'Bob Solo', email: 'bob@example.com', email_verified: true, password: 'bbPassword' })
    /* const userChris = */ await app.db.models.User.create({ username: 'chris', name: 'Chris Kenobi', email: 'chris@example.com', password: 'ccPassword' })
    const team1 = await app.db.models.Team.create({ name: 'ATeam' })
    const team2 = await app.db.models.Team.create({ name: 'BTeam' })
    const team3 = await app.db.models.Team.create({ name: 'CTeam' })
    await team1.addUser(userAlice, { through: { role: Roles.Owner } })
    await team1.addUser(userBob, { through: { role: Roles.Member } })
    await team2.addUser(userBob, { through: { role: Roles.Owner } })
    await team2.addUser(userAlice, { through: { role: Roles.Owner } })
    await team3.addUser(userAlice, { through: { role: Roles.Owner } })
    return app
}