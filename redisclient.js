const redis = require("redis");
// sep 28 : migrating to redislabs on heroku, but not using process.env variable

const redisClient = redis.createClient({
  host: "http://redis-13138.c73.us-east-1-2.ec2.cloud.redislabs.com/",
  password: "91maDju64TdFVECAG9yNGKQAHiR1cWXq",
  port: 13138,
});

redisClient.on("connect", function () {
  console.log(`Redis connected`);
});

redisClient.on("ready", function () {
  //console.log("Redis ready")
});

redisClient.on("reconnecting", function () {
  console.log("Redis reconnecting");
});

redisClient.on("error", function (err) {
  console.log({ redisclient36: err.message });
});

module.exports = redisClient;
// export default redisClient;
