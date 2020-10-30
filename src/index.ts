import { Simulation } from "mini-waterfall-simulation";

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.round(Math.random() * (max - min) + min);
}

// ranges
function generateRandomSprintDayCount() {
  return getRandomInt(5, 20);
}
function generateRandomRegressionTestDayCount(sprintDayCount: number) {
  return getRandomInt(1, Math.floor(sprintDayCount / 2));
}
function generateRandomDayStartTime() {
  const latestHour = 11.0;
  const earliestHour = 8.0;
  const increment = 0.25; // 15 minutes
  const rangeMax = (latestHour - earliestHour) * 4;
  return getRandomInt(0, rangeMax) * increment + earliestHour;
}
function generateRandomProgrammerCount() {
  return getRandomInt(1, 6);
}
function generateRandomTesterCount() {
  return getRandomInt(1, 6);
}
function generateRandomMaxInitialDevTime() {
  return getRandomInt(5, 20);
}
function generateRandomMaxFullRunCheckTime() {
  return getRandomInt(4, 40);
}
function generateRandomAveragePassBackCount() {
  return getRandomInt(0, 4);
}
function generateRandomCheckRefinementPercentage() {
  return getRandomInt(10, 95) / 100;
}

function getRandomSimulationResults() {
  const sprintDayCount = generateRandomSprintDayCount();
  const regressionTestDayCount = generateRandomRegressionTestDayCount(
    sprintDayCount
  );
  const dayStartTime = generateRandomDayStartTime();
  const programmerCount = generateRandomProgrammerCount();
  const testerCount = generateRandomTesterCount();
  const maxInitialDevTime = generateRandomMaxInitialDevTime();
  const maxFullRunCheckTime = generateRandomMaxFullRunCheckTime();
  const averagePassBackCount = generateRandomAveragePassBackCount();
  const checkRefinementPercentage = generateRandomCheckRefinementPercentage();
  return new Simulation(
    sprintDayCount,
    regressionTestDayCount,
    dayStartTime,
    programmerCount,
    testerCount,
    maxInitialDevTime,
    maxFullRunCheckTime,
    averagePassBackCount,
    checkRefinementPercentage,
  );
}

interface MetricReference {
    [value: number]: Simulation[];
}

const sims: Simulation[] = [];
const sprintDayCount: MetricReference = {};
const regressionTestDayCount: MetricReference = {};
const dayStartTime: MetricReference = {};
const programmerCount: MetricReference = {};
const testerCount: MetricReference = {};
const maxInitialProgrammerWorkTimeInHours: MetricReference = {};
const maxFullRunTesterWorkTimeInHours: MetricReference = {};
const averagePassBackCount: MetricReference = {};
const checkRefinement: MetricReference = {};
const sustainableSims: Simulation[] = [];
for (let i = 0; i < 10000; i++) {
    console.log(i);
    let newSim = getRandomSimulationResults();
    newSim.simulate();
    if(!sprintDayCount[newSim.sprintDayCount as keyof MetricReference]) {
        sprintDayCount[newSim.sprintDayCount as keyof MetricReference] = [];
    }
    sprintDayCount[newSim.sprintDayCount as keyof MetricReference].push(newSim);
    if(!regressionTestDayCount[newSim.regressionTestDayCount as keyof MetricReference]) {
        regressionTestDayCount[newSim.regressionTestDayCount as keyof MetricReference] = [];
    }
    regressionTestDayCount[newSim.regressionTestDayCount as keyof MetricReference].push(newSim);
    if(!dayStartTime[newSim.dayStartTime as keyof MetricReference]) {
        dayStartTime[newSim.dayStartTime as keyof MetricReference] = [];
    }
    dayStartTime[newSim.dayStartTime as keyof MetricReference].push(newSim);
    if(!programmerCount[newSim.programmerCount as keyof MetricReference]) {
        programmerCount[newSim.programmerCount as keyof MetricReference] = [];
    }
    programmerCount[newSim.programmerCount as keyof MetricReference].push(newSim);
    if(!testerCount[newSim.testerCount as keyof MetricReference]) {
        testerCount[newSim.testerCount as keyof MetricReference] = [];
    }
    testerCount[newSim.testerCount as keyof MetricReference].push(newSim);
    if(!maxInitialProgrammerWorkTimeInHours[newSim.maxInitialProgrammerWorkTimeInHours as keyof MetricReference]) {
        maxInitialProgrammerWorkTimeInHours[newSim.maxInitialProgrammerWorkTimeInHours as keyof MetricReference] = [];
    }
    maxInitialProgrammerWorkTimeInHours[newSim.maxInitialProgrammerWorkTimeInHours as keyof MetricReference].push(newSim);
    if(!maxFullRunTesterWorkTimeInHours[newSim.maxFullRunTesterWorkTimeInHours as keyof MetricReference]) {
        maxFullRunTesterWorkTimeInHours[newSim.maxFullRunTesterWorkTimeInHours as keyof MetricReference] = [];
    }
    maxFullRunTesterWorkTimeInHours[newSim.maxFullRunTesterWorkTimeInHours as keyof MetricReference].push(newSim);
    if(!averagePassBackCount[newSim.averagePassBackCount as keyof MetricReference]) {
        averagePassBackCount[newSim.averagePassBackCount as keyof MetricReference] = [];
    }
    averagePassBackCount[newSim.averagePassBackCount as keyof MetricReference].push(newSim);
    if(!checkRefinement[newSim.checkRefinement as keyof MetricReference]) {
        checkRefinement[newSim.checkRefinement as keyof MetricReference] = [];
    }
    checkRefinement[newSim.checkRefinement as keyof MetricReference].push(newSim);
    if (newSim.projectedSprintCountUntilDeadlock === null) {
        sustainableSims.push(newSim);
        console.log('----------------------------------');
        console.log(newSim.projectedSprintCountUntilDeadlock);
        console.log(`sprintDayCount: ${newSim.sprintDayCount}`);
        console.log(`regressionTestDayCount: ${newSim.regressionTestDayCount}`);
        console.log(`dayStartTime: ${newSim.dayStartTime}`);
        console.log(`programmerCount: ${newSim.programmerCount}`);
        console.log(`testerCount: ${newSim.testerCount}`);
        console.log(`maxInitialProgrammerWorkTimeInHours: ${newSim.maxInitialProgrammerWorkTimeInHours}`);
        console.log(`maxFullRunTesterWorkTimeInHours: ${newSim.maxFullRunTesterWorkTimeInHours}`);
        console.log(`averagePassBackCount: ${newSim.averagePassBackCount}`);
        console.log(`checkRefinement: ${newSim.checkRefinement}`);
        console.log(`total tickets: ${newSim.ticketFactory.ticketsMade}`);
        console.log(`total tickets completed: ${newSim.doneStack.length}`);
        console.log(`total tickets automated: ${newSim.automatedStack.length}`);
        console.log(`percentage of tickets finished: ${(newSim.doneStack.length / newSim.ticketFactory.ticketsMade) * 100} %`);
        console.log(`percentage of tickets actually finished: ${(newSim.automatedStack.length / newSim.ticketFactory.ticketsMade) * 100} %`);
        console.log(`fluff checking time: ${newSim.workerDataForDayTime[newSim.workerDataForDayTime.length - 1].cumulativeMinutes.fluffChecking}`);
        console.log('----------------------------------');
    }
    sims.push(newSim);
}
