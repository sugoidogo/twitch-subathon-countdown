const client_id='ib2n7v7mur7ab2mcxv7rjju2ctsyoi'
const message_ids=[]
const timer=document.querySelector('#timeText')
let tba,tokens,pubsub,ping_tid,pong_tid,eventsub,sse,time_started,time_passed,time_total,config,localforage,streamelements
/** @type WebSocket */
let irc

window.onanimationend=function(event){
	event.target.remove()
}

window.onload=async function(){
	// init localforage
	localforage=(await import('https://cdn.jsdelivr.net/npm/localforage/+esm')).default
	localforage=localforage.createInstance({name:'sugoi-subathon-countdown'})
	// init timer display
	time_started=await localforage.getItem('time_started')
	time_passed=await localforage.getItem('time_passed')
	time_total=await localforage.getItem('time_total')
	updateTime()
	// init twitch api tokens
	tba=await import('https://tba.sugoidogo.com/tba.mjs')
	tokens=await tba.get_tokens(client_id)
	// load user config
	await load_config()
	// init event sources
	init_irc()
	init_pubsub()
	init_eventsub()
	if('streamelements-token' in config){
		init_streamelements()
	}
}

function handle_event(event_name,event_amount=1){
	if(!config[event_name+'-time-enabled']){
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

function load_config(){
	return fetch('https://ts.sugoidogo.com/config.json',{headers:tokens.auth_headers})
	.then(response=>response.json())
	.then(json=>{
		config=json
		if(!time_started && !time_passed){
			reset()
		}
	})
}

function add_time(time){
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

function init_pubsub(){
	if(pong_tid){
		clearTimeout(pong_tid)
		pong_tid=null
	}
	if(ping_tid){
		clearTimeout(ping_tid)
		ping_tid=null
	}
	if(pubsub){
		pubsub.close()
	}
	pubsub=new WebSocket('wss://pubsub-edge.twitch.tv')
	pubsub.onopen=function(){
		pubsub.send(JSON.stringify({
			"type":"LISTEN",
			"data":{
				"auth_token":tokens.access_token,
				"topics":[
					"channel-bits-events-v2."+tokens.user_id,
					"channel-subscribe-events-v1."+tokens.user_id
				]
			}
		}))
	}
	pubsub.onmessage=function(event){
		let message=JSON.parse(event.data)
		console.debug(message)
		switch(message.type){
			case 'RESPONSE':{
				if(message.error){
					throw message.error
				}
				pubsub_ping()
				break
			}
			case 'PONG':{
				clearTimeout(pong_tid)
				pong_tid=null
				break
			}
			case 'RECONNECT':{
				init_pubsub()
				break
			}
			case 'AUTH_REVOKED':{
				location.reload()
				break
			}
			case 'MESSAGE':{
				message=JSON.parse(message.data.message).data
				console.debug(message)
				if('sub_tier' in message){
					handle_event('sub'+message.sub_tier)
					break
				}
				if('bits_used' in message){
					handle_event('bit',message.bits_used)
					break
				}
			}
		}
	}
}

function pubsub_ping(){
	pubsub.send(JSON.stringify({'type':'PING'}))
	const time=Math.floor(Math.random() * (5*60*1000))
	ping_tid=setTimeout(pubsub_ping,time)
	pong_tid=setTimeout(init_pubsub,20000)
}

function init_eventsub(){
	eventsub=new WebSocket('wss://eventsub.wss.twitch.tv/ws')
	eventsub.onmessage=function(event){
		let message=JSON.parse(event.data)
		console.debug(message)
		if(message.metadata.message_id in message_ids){
			return
		}else{
			message_ids.push(message.metadata.message_id)
		}
		switch(message.metadata.message_type){
			case 'session_welcome':{
				let session_id=message.payload.session.id
				const headers={'content-type':'application/json'}
				Object.assign(headers,tokens.auth_headers)
				const url=new URL('https://api.twitch.tv/helix/eventsub/subscriptions')
				subscriptions=[
					{
						"type": "channel.follow",
						"version": "2",
						"condition": {
							"broadcaster_user_id": tokens.user_id,
							"moderator_user_id": tokens.user_id
						},
						"transport": {
							"method": "websocket",
							"session_id": session_id,
						}
					},
					{
						"type": "channel.raid",
						"version": "1",
						"condition": {
							"to_broadcaster_user_id": tokens.user_id
						},
						"transport": {
							"method": "websocket",
							"session_id": session_id,
						}
					},
					{
						"type": "channel.charity_campaign.donate",
						"version": "1",
						"condition": {
							"broadcaster_user_id": tokens.user_id
						},
						"transport": {
							"method": "websocket",
							"session_id": session_id,
						}
					}
				]
				for(const subscription of subscriptions){
					fetch(url,{
						headers:headers,
						method:"POST",
						body:JSON.stringify(subscription)
					})
				}
				break
			}
			case 'notification':{
				switch(message.metadata.subscription_type){
					case 'channel.follow':{
						handle_event('follow')
						break
					}
					case 'channel.raid':{
						handle_event('raid')
						break
					}
					case 'channel.charity_campaign.donate':{
						handle_event('charity',message.event.amount.value)
					}
				}
			}
		}
	}
}

function ircSend(message){
	console.debug('< '+message)
	irc.send(message)
}

async function init_irc(){
	if(irc){
		irc.close()
	}
	irc=new WebSocket('wss://irc-ws.chat.twitch.tv:443')
	irc.onclose=init_irc
	irc.onopen=function(){
		ircSend('CAP REQ twitch.tv/tags')
		ircSend('PASS oauth:'+tokens.access_token)
		ircSend('NICK '+tokens.login)
		ircSend('JOIN #'+tokens.login)
	}
	irc.onmessage=function(event){
		console.debug(event)
		for(let data of event.data.split('\r\n')){
			console.debug('> '+data)
			/** @type string */
			data=data.split(':')
			const tags=data.shift()
			const type=data.shift()
			const message=data.join(':')
			console.debug(tags,type,message)
			if(!message){
				continue
			}
			if(!(tags.includes('broadcaster') || tags.includes('moderator'))){
				continue
			}
			const command=message.split(' ')
			console.debug(command)
			if(command.shift()!='!subathon'){
				continue
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
		}
	}
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