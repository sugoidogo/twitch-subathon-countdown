const timeText = document.getElementById("timeText");

let endingTime = new Date(Date.now());
endingTime = timeFunc.addHours(endingTime, initialHours);
endingTime = timeFunc.addMinutes(endingTime, initialMinutes);
endingTime = timeFunc.addSeconds(endingTime, initialSeconds);

let countdownEnded = false;
let users = [];
let time;

const getNextTime = () => {
    let currentTime = new Date(Date.now());
    let differenceTime = endingTime - currentTime;
    time = `${timeFunc.getHours(differenceTime)}:${timeFunc.getMinutes(differenceTime)}:${timeFunc.getSeconds(differenceTime)}`;
    if (differenceTime <= 0) {
        clearInterval(countdownUpdater);
        countdownEnded = true;
        time = "00:00:00";
    }
    timeText.innerText = time;
};

let countdownUpdater = setInterval(() => {
    getNextTime();
}, 1);



const addTime = async (time, s) => {
    let addedTime = document.createElement("p");
    addedTime.classList = "addedTime";
    addedTime.innerText = `+${s}s`;
    document.body.appendChild(addedTime);
    addedTime.style.display = "block";
    await sleep(50);
    addedTime.style.left = `${randomInRange(35, 65)}%`;
    addedTime.style.top = `${randomInRange(15, 40)}%`;
    addedTime.style.opacity = "1";
	while(s > 0){
        timeStep = s > 60 ? s/30 : 2
        endingTime = timeFunc.addSeconds(time, timeStep)
        await sleep(50);
        s -= timeStep
	}
    await sleep(200);
    addedTime.style.opacity = "0";
    await sleep(200);
    addedTime.remove();
};



const testAddTime = (times, delay) => {
    let addTimeInterval = setInterval(async () => {
        if (times > 0) {
            await sleep(randomInRange(50, delay-50));
            addTime(endingTime, 6000);
            --times;
        }
        else {
            clearInterval(addTimeInterval);
        }
    }, delay);
};
