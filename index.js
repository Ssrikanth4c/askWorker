// import { Worker, Plugins, Scheduler, Queue } from "node-resque";
const redisClient = require("./redisclient.js");
async function boot() {
  //   const connectionDetails = new redisClient();
  //   redis.createClient({
  //     host: "http://redis-13138.c73.us-east-1-2.ec2.cloud.redislabs.com/",
  //     password: "config.herokuredislabsPass",
  //     port: 13138,
  //   });
  const connectionDetails = {
    // pkg: "redis",
    host: "http://redis-13138.c73.us-east-1-2.ec2.cloud.redislabs.com/",
    password: "91maDju64TdFVECAG9yNGKQAHiR1cWXq",
    port: 13138,
    // database: 0,
    // namespace: 'resque',
    // looping: true,
    // options: {password: 'abc'},
  };
  let jobsToComplete = 0;
  const jobs = {
    add: {
      plugins: [Plugins.JobLock],
      pluginOptions: {
        JobLock: { reEnqueue: true },
      },
      perform: async (a, b) => {
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
        jobsToComplete--;
        tryShutdown();

        const answer = a + b;
        return answer;
      },
    },
    subtract: {
      perform: (a, b) => {
        jobsToComplete--;
        tryShutdown();

        const answer = a - b;
        return answer;
      },
    },
  };

  // just a helper for this demo
  async function tryShutdown() {
    if (jobsToComplete === 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
      await scheduler.end();
      await worker.end();
      process.exit();
    }
  }
  const worker = new Worker(
    { connection: connectionDetails, queues: ["math", "otherQueue"] },
    jobs
  );
  await worker.connect();
  worker.start();
  /////////////////////
  // START A SCHEDULER //
  // ////////////////////

  const scheduler = new Scheduler({ connection: connectionDetails });
  await scheduler.connect();
  scheduler.start();

  // //////////////////////
  // REGISTER FOR EVENTS //
  // //////////////////////

  worker.on("start", () => {
    console.log("worker started");
  });
  worker.on("end", () => {
    console.log("worker ended");
  });
  worker.on("cleaning_worker", (worker, pid) => {
    console.log(`cleaning old worker ${worker}`);
  });
  worker.on("poll", (queue) => {
    console.log(`worker polling ${queue}`);
  });
  worker.on("job", (queue, job) => {
    console.log(`working job ${queue} ${JSON.stringify(job)}`);
  });
  worker.on("reEnqueue", (queue, job, plugin) => {
    console.log(`reEnqueue job (${plugin}) ${queue} ${JSON.stringify(job)}`);
  });
  worker.on("success", (queue, job, result, duration) => {
    console.log(
      `job success ${queue} ${JSON.stringify(job)} >> ${result} (${duration}ms)`
    );
  });
  worker.on("failure", (queue, job, failure, duration) => {
    console.log(
      `job failure ${queue} ${JSON.stringify(
        job
      )} >> ${failure} (${duration}ms)`
    );
  });
  worker.on("error", (error, queue, job) => {
    console.log(`error ${queue} ${JSON.stringify(job)}  >> ${error}`);
  });
  worker.on("pause", () => {
    console.log("worker paused");
  });

  scheduler.on("start", () => {
    console.log("scheduler started");
  });
  scheduler.on("end", () => {
    console.log("scheduler ended");
  });
  scheduler.on("poll", () => {
    console.log("scheduler polling");
  });
  scheduler.on("leader", () => {
    console.log("scheduler became leader");
  });
  scheduler.on("error", (error) => {
    console.log(`scheduler error >> ${error}`);
  });
  scheduler.on("cleanStuckWorker", (workerName, errorPayload, delta) => {
    console.log(
      `failing ${workerName} (stuck for ${delta}s) and failing job ${errorPayload}`
    );
  });
  scheduler.on("workingTimestamp", (timestamp) => {
    console.log(`scheduler working timestamp ${timestamp}`);
  });
  scheduler.on("transferredJob", (timestamp, job) => {
    console.log(`scheduler enquing job ${timestamp} >> ${JSON.stringify(job)}`);
  });
  // //////////////////////
  // CONNECT TO A QUEUE //
  // //////////////////////

  const queue = new Queue({ connection: connectionDetails }, jobs);
  queue.on("error", function (error) {
    console.log(error);
  });
  await queue.connect();
  await queue.enqueue("math", "add", [1, 2]);
  await queue.enqueue("math", "add", [1, 2]);
  await queue.enqueue("math", "add", [2, 3]);
  await queue.enqueueIn(3000, "math", "subtract", [2, 1]);
  jobsToComplete = 4;
}
// boot();
console.log("test", redisClient);
