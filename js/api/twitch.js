if (twitch_channel_name !== "") {
    const client = new tmi.client({
        connection: {
            reconnect: true,
            secure: true,
        },
        channels: [twitch_channel_name],
    });

    client.connect();
    logMessage("Twitch", `Client Connected`);

    client.on('subscription', (channel, username, methods, message, userstate) => {
        if (!countdownEnded && subEnable) {
            let factor_t1_local = (happy_hour_active ? factor_t1 : 1) * (random_hour_active ? randomInRangeNoRounding(...range_t1): 1);
            let factor_t2_local = (happy_hour_active ? factor_t2  : 1) * (random_hour_active ? randomInRangeNoRounding(...range_t2): 1);
            let factor_t3_local = (happy_hour_active ? factor_t3 : 1) * (random_hour_active ? randomInRangeNoRounding(...range_t3): 1);

            switch (methods['plan']) {
                case "Prime":
                    addTime(endingTime, seconds_added_per_sub_prime * factor_t1_local);
                    logMessage("Twitch", `Added ${seconds_added_per_sub_prime * factor_t1_local} Seconds Because ${username} Subscribed With Prime`);
                    break;
                case "1000":
                    addTime(endingTime, seconds_added_per_sub_tier1 * factor_t1_local);
                    logMessage("Twitch", `Added ${seconds_added_per_sub_tier1 * factor_t1_local} Seconds Because ${username} Subscribed With Tier 1`);
                    break;
                case "2000":
                    addTime(endingTime, seconds_added_per_sub_tier2 * factor_t2_local);
                    logMessage("Twitch", `Added ${seconds_added_per_sub_tier2 * factor_t2_local} Seconds Because ${username} Subscribed With Tier 2`);
                    break;
                case "3000":
                    addTime(endingTime, seconds_added_per_sub_tier3 * factor_t3_local);
                    logMessage("Twitch", `Added ${seconds_added_per_sub_tier3 * factor_t3_local} Seconds Because ${username} Subscribed With Tier 3`);
                    break;
            }
            if (!users.includes(username)) {
                users.push(username);
            }
        }
    });

    client.on('resub', (channel, username, months, message, userstate, methods) => {
        if (!countdownEnded && subEnable) {
            let factor_t1_local = (happy_hour_active ? factor_t1 : 1) * (random_hour_active ? randomInRangeNoRounding(...range_t1): 1);
            let factor_t2_local = (happy_hour_active ? factor_t2  : 1) * (random_hour_active ? randomInRangeNoRounding(...range_t2): 1);
            let factor_t3_local = (happy_hour_active ? factor_t3 : 1) * (random_hour_active ? randomInRangeNoRounding(...range_t3): 1);

            switch (methods['plan']) {
                case "Prime":
                    addTime(endingTime, seconds_added_per_resub_prime * factor_t1_local);
                    logMessage("Twitch", `Added ${seconds_added_per_resub_prime * factor_t1_local} Seconds Because ${username} ReSubscribed With Prime`);
                    break;
                case "1000":
                    addTime(endingTime, seconds_added_per_resub_tier1 * factor_t1_local);
                    logMessage("Twitch", `Added ${seconds_added_per_resub_tier1 * factor_t1_local} Seconds Because ${username} ReSubscribed With Tier 1`);
                    break;
                case "2000":
                    addTime(endingTime, seconds_added_per_resub_tier2 * factor_t2_local);
                    logMessage("Twitch", `Added ${seconds_added_per_resub_tier2 * factor_t2_local} Seconds Because ${username} ReSubscribed With Tier 2`);
                    break;
                case "3000":
                    addTime(endingTime, seconds_added_per_resub_tier3 * factor_t3_local);
                    logMessage("Twitch", `Added ${seconds_added_per_resub_tier3 * factor_t3_local} Seconds Because ${username} ReSubscribed With Tier 3`);
                    break;
            }
            if (!users.includes(username)) {
                users.push(username);
            }
        }
    });

    client.on('subgift', (channel, username, months, recipient, methods, userstate) => {
        if (!countdownEnded && subEnable) {
            let factor_t1_local = (happy_hour_active ? factor_t1 : 1) * (random_hour_active ? randomInRangeNoRounding(...range_t1): 1);
            let factor_t2_local = (happy_hour_active ? factor_t2  : 1) * (random_hour_active ? randomInRangeNoRounding(...range_t2): 1);
            let factor_t3_local = (happy_hour_active ? factor_t3 : 1) * (random_hour_active ? randomInRangeNoRounding(...range_t3): 1);

            switch (methods['plan']) {
                case "Prime":
                    addTime(endingTime, seconds_added_per_giftsub_prime * factor_t1_local);
                    logMessage("Twitch", `Added ${seconds_added_per_giftsub_prime * factor_t1_local} Seconds Because ${username} gifted Sub With Prime`);
                    break;
                case "1000":
                    addTime(endingTime, seconds_added_per_giftsub_tier1 * factor_t1_local);
                    logMessage("Twitch", `Added ${seconds_added_per_giftsub_tier1 * factor_t1_local} Seconds Because ${username} gifted Sub With Tier 1`);
                    break;
                case "2000":
                    addTime(endingTime, seconds_added_per_giftsub_tier2 * factor_t2_local);
                    logMessage("Twitch", `Added ${seconds_added_per_giftsub_tier2 * factor_t2_local} Seconds Because ${username} gifted Sub With Tier 2`);
                    break;
                case "3000":
                    addTime(endingTime, seconds_added_per_giftsub_tier3 * factor_t3_local);
                    logMessage("Twitch", `Added ${seconds_added_per_giftsub_tier3 * factor_t3_local} Seconds Because ${username} gifted Sub With Tier 3`);
                    break;
            }
            if (!users.includes(username)) {
                users.push(username);
            }
        }
    });

    client.on('cheer', (channel, userstate, message) => {
        if (!countdownEnded && bitEnable) {
            let factor_bits_local = (happy_hour_active ? factor_bits : 1) * (random_hour_active ? randomInRangeNoRounding(...range_bits): 1);

            if (userstate.bits >= min_amount_of_bits) {
                let times = Math.floor(userstate.bits/min_amount_of_bits);
                addTime(endingTime, seconds_added_per_bits * times * factor_bits_local);
                logMessage("Twitch", `Added ${seconds_added_per_bits * times} Seconds Because ${userstate['display-name']} Donated ${userstate.bits} Bits`);
                if (!users.includes(userstate['display-name'])) {
                    users.push(userstate['display-name']);
                }
            }
        }
    });
}