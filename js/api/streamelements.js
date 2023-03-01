if (streamelements_token !== "") {
    var streamElementsSocket;
    const streamElementsConnect = () => {
        streamElementsSocket = undefined;
        streamElementsSocket = io('https://realtime.streamelements.com', {
            transports: ['websocket']
        });

        streamElementsSocket.on('connect', onConnect);
        streamElementsSocket.on('disconnect', onDisconnect);
        streamElementsSocket.on('authenticated', onAuthenticated);
        streamElementsSocket.on('unauthorized', console.error);
        streamElementsSocket.on('event:test', onEvent);
        streamElementsSocket.on('event', onEvent);
        streamElementsSocket.on('event:update', onEvent);
        streamElementsSocket.on('event:reset', onEvent);

        function onConnect() {
            logMessage("StreamElements", "Socket Connected");
            streamElementsSocket.emit('authenticate', {method: 'apikey', token: streamelements_token});
        }

        function onDisconnect() {
            logMessage("StreamElements", "Socket Disconnected");
            streamElementsConnect();
        }

        function onAuthenticated(data) {
            const {
                channelId
            } = data;
            logMessage("StreamElements", `Channel ${channelId} Connected`);
        }

        function onEvent(data) {
            logObject("StreamElements", data);
            if (!countdownEnded) {
                let factor_t1_local = (happy_hour_active ? factor_t1 : 1) * (random_hour_active ? randomInRangeNoRounding(...range_t1): 1);
                let factor_t2_local = (happy_hour_active ? factor_t2  : 1) * (random_hour_active ? randomInRangeNoRounding(...range_t2): 1);
                let factor_t3_local = (happy_hour_active ? factor_t3 : 1) * (random_hour_active ? randomInRangeNoRounding(...range_t3): 1);
                let factor_bits_local = (happy_hour_active ? factor_bits : 1) * (random_hour_active ? randomInRangeNoRounding(...range_bits): 1);
                let factor_donations_local = (happy_hour_active ? factor_donations : 1) * (random_hour_active ? randomInRangeNoRounding(...range_donations): 1);

                if ((data['listener'] === "subscriber-latest") && subEnable) {
                    if (data['event']['gifted'] || data['event']['bulkGifted']) {
                        let amount;
                        if (data['event']['gifted']) amount = 1;
                        else amount = data['event']['amount'];
                        if (data['event']['tier'] == "prime" || data['event']['tier'] == "1000") {
                            addTime(endingTime, seconds_added_per_giftsub_tier1 * amount * factor_t1_local);
                            logMessage("StreamElements", `Added ${seconds_added_per_giftsub_tier1 * amount * factor_t1_local} Seconds Because ${data['event']['name']} Gifted ${amount} Tier 1 Subs`);
                        }
                        else if (data['event']['tier'] == "2000") {
                            addTime(endingTime, seconds_added_per_giftsub_tier2 * amount * factor_t2_local);
                            logMessage("StreamElements", `Added ${seconds_added_per_giftsub_tier2 * amount * factor_t2_local} Seconds Because ${data['event']['name']} Gifted ${amount} Tier 2 Subs`);
                        }
                        else if (data['event']['tier'] == "3000") {
                            addTime(endingTime, seconds_added_per_giftsub_tier3 * amount * factor_t3_local);
                            logMessage("StreamElements", `Added ${seconds_added_per_giftsub_tier3 * amount * factor_t3_local} Seconds Because ${data['event']['name']} Gifted ${amount} Tier 3 Subs`);
                        }
                    }
                    else if (data['event']['amount'] != "1") {
                        if (data['event']['tier'] == "prime") {
                            addTime(endingTime, seconds_added_per_resub_prime * factor_t1_local);
                            logMessage("StreamElements", `Added ${seconds_added_per_resub_prime * factor_t1_local} Seconds Because ${data['event']['name']} ReSubscribed With Prime`);
                        }
                        else if (data['event']['tier'] == "1000") {
                            addTime(endingTime, seconds_added_per_resub_tier1 * factor_t1_local);
                            logMessage("StreamElements", `Added ${seconds_added_per_resub_tier1 * factor_t1_local} Seconds Because ${data['event']['name']} ReSubscribed With Tier 1`);
                        }
                        else if (data['event']['tier'] == "2000") {
                            addTime(endingTime, seconds_added_per_resub_tier2 * factor_t2_local);
                            logMessage("StreamElements", `Added ${seconds_added_per_resub_tier2 * factor_t2_local} Seconds Because ${data['event']['name']} ReSubscribed With Tier 2`);
                        }
                        else if (data['event']['tier'] == "3000") {
                            addTime(endingTime, seconds_added_per_resub_tier3 * factor_t3_local);
                            logMessage("StreamElements", `Added ${seconds_added_per_resub_tier3 * factor_t3_local} Seconds Because ${data['event']['name']} ReSubscribed With Tier 3`);
                        }
                    }
                    else {
                        if (data['event']['tier'] == "prime") {
                            addTime(endingTime, seconds_added_per_sub_prime * factor_t1_local);
                            logMessage("StreamElements", `Added ${seconds_added_per_sub_prime * factor_t1_local} Seconds Because ${data['event']['name']} Subscribed With Prime`);
                        }
                        else if (data['event']['tier'] == "1000") {
                            addTime(endingTime, seconds_added_per_sub_tier1 * factor_t1_local);
                            logMessage("StreamElements", `Added ${seconds_added_per_sub_tier1 * factor_t1_local} Seconds Because ${data['event']['name']} Subscribed With Tier 1`);
                        }
                        else if (data['event']['tier'] == "2000") {
                            addTime(endingTime, seconds_added_per_sub_tier2 * factor_t2_local);
                            logMessage("StreamElements", `Added ${seconds_added_per_sub_tier2 * factor_t2_local} Seconds Because ${data['event']['name']} Subscribed With Tier 2`);
                        }
                        else if (data['event']['tier'] == "3000") {
                            addTime(endingTime, seconds_added_per_sub_tier3 * factor_t3_local);
                            logMessage("StreamElements", `Added ${seconds_added_per_sub_tier3 * factor_t3_local} Seconds Because ${data['event']['name']} Subscribed With Tier 3`);
                        }
                    }
                    if (!users.includes(data['event']['name'])) {
                        users.push(data['event']['name']);
                    }
                }

                else if ((data['listener'] === "cheer-latest") && bitEnable) {
                    if (data['event']['amount'] >= min_amount_of_bits) {
                        let times = Math.floor(data['event']['amount']/min_amount_of_bits);
                        addTime(endingTime, seconds_added_per_bits * times * factor_bits_local);
                        logMessage("StreamElements", `Added ${seconds_added_per_bits * times * factor_bits_local} Seconds Because ${data['event']['name']} Donated ${data['event']['amount']} Bits`);
                        if (!users.includes(data['event']['name'])) {
                            users.push(data['event']['name']);
                        }
                    }
                }

                else if ((data['listener'] === "tip-latest") && donationEnable) {
                    if (data['event']['amount'] >= min_donation_amount) {
                        let times = Math.floor(data['event']['amount']/min_donation_amount);
                        addTime(endingTime, seconds_added_per_donation * times * factor_donations_local);
                        logMessage("StreamElements", `Added ${seconds_added_per_donation * times * factor_donations_local} Seconds Because ${data['event']['name']} Donated ${data['event']['amount']}$`);
                        if (!users.includes(data['event']['name'])) {
                            users.push(data['event']['name']);
                        }
                    }
                }
            }
        }
    }
    streamElementsConnect();
}