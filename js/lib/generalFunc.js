const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const randomInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
};

const randomBellSkew = (min, max, skew) => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random() //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random()
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )

    num = num / 10.0 + 0.5 // Translate to 0 -> 1
    if (num > 1 || num < 0) 
      num = randomBellSkew(min, max, skew) // resample between 0 and 1 if out of range

    else{
        num = Math.pow(num, skew) // Skew
        num *= max - min // Stretch to fill range
        num += min // offset to min
    }

    return num
}

const logMessage = (module, message) => {
    console.log(`[${module}]: ${message}`);
};

const logObject = (module, object) => {
    console.log(`[${module}]: `, object);
};


