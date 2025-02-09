import AuthProvider from 'https://ebs.sugoidogo.com/SugoiAuthProvider.mjs'
import WebStorage from 'https://ebs.sugoidogo.com/WebStorage.mjs'
import { ApiClient } from 'https://cdn.jsdelivr.net/npm/@twurple/api@7/+esm'
import { EventSubWsListener } from 'https://cdn.jsdelivr.net/npm/@twurple/eventsub-ws@7/+esm'

const client_id = 'ib2n7v7mur7ab2mcxv7rjju2ctsyoi'

/** @type {import('../node_modules/twitch-cloud-ebs/static/SugoiAuthProvider.mjs').default} */
const authProvider = new AuthProvider(client_id)
/** @type {import('../node_modules/twitch-cloud-ebs/static/WebStorage.mjs').default} */
const webStorage = new WebStorage(authProvider)
/** @type {import('@twurple/api').ApiClient} */
const apiClient = new ApiClient({ authProvider })
/** @type {import('@twurple/eventsub-ws').EventSubWsListener} */
const eventSub = new EventSubWsListener({ apiClient })

const timer=document.querySelector('#timeText')
let tokens,time_started,time_passed,time_total,config,localforage,streamelements

window.onanimationend=function(event){
	event.target.remove()
}

function handle_event(event_name, event_amount = 1) {
	console.debug(event_name,event_amount)
	if (!config[event_name + '-time-enabled']) {
		return false
	}
	add_time(parseReadableTimeIntoMilliseconds(config[event_name+'-time'])*event_amount)
	return true
}

function reset(){
	localforage.removeItem('time_started')
	time_started=null
	time_passed=null
	time_total=parseReadableTimeIntoMilliseconds(config['start-time'])
	localforage.setItem('time_total',time_total)
	localforage.setItem('time_passed',0)
}

function add_time(time){
	if(isNaN(time)){
		throw time+" is not a number"
	}
	if(config['max-time-enabled']){
		const new_time=time_total+time
		const max_time=parseReadableTimeIntoMilliseconds(config['max-time'])
		if(new_time>max_time){
			time=max_time-time_total
		}
	}
	let addedTime=document.createElement('p')
	let timeString=parseMillisecondsIntoReadableTime(time)
	if(time>0){
		timeString='+'+timeString
	}
	if(time==0){
		timeString='Timer Maxed!'
	}
	addedTime.innerHTML=timeString
	addedTime.className='addedTime'
	document.body.appendChild(addedTime);
	time_total+=time
	localforage.setItem('time_total',time_total)
}

function start(){
	if(time_started){
		return
	}
	time_started=Date.now()
	localforage.setItem('time_started',time_started)
}

function pause(){
	if(!time_started){
		return
	}
	time_passed+=Date.now()-time_started
	time_started=null
	localforage.removeItem('time_started')
	localforage.setItem('time_passed',time_passed)
}

// https://stackoverflow.com/a/33909506
function parseMillisecondsIntoReadableTime(milliseconds){
	let negative=false
	if(milliseconds<0){
		milliseconds=Math.abs(milliseconds)
		negative=true
	}

	//Get hours from milliseconds
	var hours = milliseconds / (1000*60*60);
	var absoluteHours = Math.floor(hours);
	var h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours;

	//Get remainder from hours and convert to minutes
	var minutes = (hours - absoluteHours) * 60;
	var absoluteMinutes = Math.floor(minutes);
	var m = absoluteMinutes > 9 ? absoluteMinutes : '0' +  absoluteMinutes;

	//Get remainder from minutes and convert to seconds
	var seconds = (minutes - absoluteMinutes) * 60;
	var absoluteSeconds = Math.floor(seconds);
	var s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds;

	let time = h + ':' + m + ':' + s;

	if(negative){
		time='-'+time
	}

	return time
}

function parseReadableTimeIntoMilliseconds(readableTime){
	let negative=false
	if(readableTime.startsWith('-')){
		negative=true
		readableTime=readableTime.substring(1)
	}
	const [seconds,minutes,hours]=readableTime.split(':').reverse()
	let time=((hours||0)*1000*60*60)+((minutes||0)*1000*60)+((seconds||0)*1000)
	if(negative){
		time=0-time
	}
	return time
}

function updateTime(){
	let time_remaining=time_total
	if(time_passed){
		time_remaining-=time_passed
	}
	if(time_started){
		time_remaining-=Date.now()-time_started
	}
	timer.innerHTML=parseMillisecondsIntoReadableTime(time_remaining)
	requestAnimationFrame(updateTime)
}

function init_streamelements(){
	streamelements=io('https://realtime.streamelements.com',{transports: ['websocket']})
	streamelements.on('disconnect',init_streamelements)
	streamelements.on('connect',()=>streamelements.emit('authenticate', {method: 'apikey', token: config['streamelements-token']}))
	streamelements.on('authenticated', console.debug);
    streamelements.on('unauthorized', console.error);
	
	function onEvent(event){
		console.debug(event)
		if(event['name'] !== "tip-latest"){
			return false
		}
		handle_event('tip',event['data']['amount']*100)
	}

	streamelements.on('event:test', onEvent);
	streamelements.on('event', onEvent);
	streamelements.on('event:update', onEvent);
	streamelements.on('event:reset', onEvent);
}

// init localforage
localforage = (await import('https://cdn.jsdelivr.net/npm/localforage/+esm')).default
localforage = localforage.createInstance({ name: 'sugoi-subathon-countdown' })
// init timer display
time_started = await localforage.getItem('time_started')
time_passed = await localforage.getItem('time_passed')
time_total = await localforage.getItem('time_total')
updateTime()
// init twitch api tokens
tokens = await authProvider.getAccessTokenForUser(null)
await apiClient.getTokenInfo().then(info => tokens.user_id = info.userId)
// load user config
await webStorage.fetch('config.json',{headers:tokens.auth_headers})
.then(response=>response.json())
.then(json=>{
	config=json
	if(!time_started && !time_passed){
		reset()
	}
})
// create real time mod list
const mods = await apiClient.moderation.getModeratorsPaginated(tokens.user_id).getAll()
eventSub.onChannelModeratorAdd(tokens.user_id, event => mods.push(event.userId))
eventSub.onChannelModeratorRemove(tokens.user_id, event => mods.slice(mods.indexOf(event.userId), 1))
// init event sources
eventSub.onChannelSubscription(tokens.user_id, event => handle_event('sub' + event.tier))
eventSub.onChannelCheer(tokens.user_id, event => handle_event('bit ', event.bits))
eventSub.onChannelFollow(tokens.user_id, tokens.user_id, event => handle_event('follow'))
eventSub.onChannelRaidFrom(tokens.user_id, event => handle_event('raid'))
eventSub.onChannelCharityDonation(tokens.user_id, event => handle_event('charity', event.amount.value))
eventSub.onChannelChatMessage(tokens.user_id, tokens.user_id, event => {
	console.debug('> ' + event.messageText)
	const command = event.messageText.split(' ')
	if ((command.shift()!='!subathon') || event.chatterId !== tokens.user_id && (!mods.includes(event.chatterId))) {
		return
	}
	switch(command.shift()){
		case 'start':{
			start()
			break
		}
		case 'pause':{
			pause()
			break
		}
		case 'reset':{
			reset()
			break
		}
		case 'add':{
			add_time(parseReadableTimeIntoMilliseconds(command.shift()))
			break
		}
	}
})
eventSub.start()

if ('streamelements-token' in config) {
	init_streamelements()
}

console.debug('load complete')