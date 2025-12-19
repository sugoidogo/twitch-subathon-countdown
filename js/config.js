{
    const url = new URL(location)
    url.hostname = 'subathon.sugoidogo.com'
    url.pathname = '/'
    location.assign(url)
}

const status_div = document.querySelector('div#status')
onerror = function (error) {
    status_div.innerHTML = error.message
    //throw new Error(null,{cause:error})
}
onunhandledrejection = (event) => onerror(event.reason)

import AuthProvider from 'https://ebs.sugoidogo.com/SugoiAuthProvider.mjs'
import WebStorage from 'https://ebs.sugoidogo.com/WebStorage.mjs'

const client_id = 'ib2n7v7mur7ab2mcxv7rjju2ctsyoi'
const scope = 'moderator:read:followers channel:read:subscriptions bits:read channel:read:charity chat:read chat:edit moderation:read channel:manage:moderators user:read:chat'

/** @type {import('../node_modules/twitch-cloud-ebs/static/SugoiAuthProvider.mjs').default} */
const authProvider = new AuthProvider(client_id)
const tokens=await authProvider.addUser(...scope.split(' '))

/** @type {import('../node_modules/twitch-cloud-ebs/static/WebStorage.mjs').default} */
const webStorage = new WebStorage(authProvider)

document.querySelector('#timer-link').href += '?refresh_token=' + tokens.refresh_token
status_div.innerHTML = 'Loading settings...'
const FormDataDeep = await import('https://sugoidogo.github.io/js-util/FormDataDeep.mjs')
const config = await webStorage.fetch('config.json')
    .then(async response => {
        if (response.ok) {
            try {
                return await response.json()
            } catch {
                return {}
            }
        }
        console.warn(response.code, await response.text())
        return {}
    }
    ).then(config => {
        for (const checkbox of document.querySelectorAll('input[type=checkbox]')) {
            checkbox.checked = false
        }
        for (const key in config) {
            const input = document.querySelector('[name=' + key + ']')
            if (!input) {
                continue
            }
            if (input.type == 'checkbox') {
                input.checked = true
            } else {
                input.value = config[key]
            }
        }
    })
status_div.innerHTML = 'Ready!'
document.querySelector('form#config').onsubmit =async function (event) {
    event.preventDefault()
    status_div.innerHTML = 'Saving settings...'
    const config = Object.fromEntries(new FormData(event.target))
    await webStorage.fetch('config.json', {
        method: 'POST',
        body: JSON.stringify(config)
    }).then(response=>{
        if(!response.ok){
            throw new Error(response.statusText,{cause:response})
        }
    })
    status_div.innerHTML = 'Settings saved'
}