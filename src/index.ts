import { Simulation } from "mini-waterfall-simulation";
import {createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import cluster from 'cluster';
import * as os from 'os';
import * as path from 'path';
import fs from 'fs-extra';
import { CsvWriter } from "csv-writer/src/lib/csv-writer";
import { ObjectMap } from "csv-writer/src/lib/lang/object";


const numCPUs = os.cpus().length;

function getRandomIntInRange(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.round(Math.random() * (max - min) + min);
}

// ranges
function generateRandomSprintDayCount() {
  const numOfWeeks = getRandomIntInRange(1, 4);
  return numOfWeeks * 5;
}
function generateRandomRegressionTestDayCount(sprintDayCount: number) {
  return getRandomIntInRange(1, Math.floor(sprintDayCount / 2));
}
function generateRandomDayStartTime() {
  const max = 11.0;
  const min = 8.0;
  const increment = 0.25; // 15 minutes
  const rangeMax = ((max - min) / increment);
  return (getRandomIntInRange(0, rangeMax) * increment) + min;
}
function generateRandomProgrammerCount() {
  return getRandomIntInRange(1, 6);
}
function generateRandomTesterCount(programmerCount: number) {
  return getRandomIntInRange(1, programmerCount);
}
function generateRandomMaxInitialDevTime() {
  const max = 20;
  const min = 2.5;
  const increment = 2.5; // 2.5 hours
  const rangeMax = ((max - min) / increment);
  return getRandomIntInRange(0, rangeMax) * increment + min;
}
function generateRandomMaxFullRunCheckTime() {
  const max = 20;
  const min = 2.5;
  const increment = 2.5; // 2.5 hours
  const rangeMax = ((max - min) / increment);
  return (getRandomIntInRange(0, rangeMax) * increment) + min;
}
function generateRandomQAAutomationTime() {
  const max = 20;
  const min = 2.5;
  const increment = 2.5; // 2.5 hours
  const rangeMax = ((max - min) / increment);
  return (getRandomIntInRange(0, rangeMax) * increment) + min;
}
function generateRandomAveragePassBackCount() {
  const max = 4;
  const min = 0.5;
  const increment = 0.5;
  const rangeMax = ((max - min) / increment);
  return (getRandomIntInRange(0, rangeMax) * increment) + min;
}
function generateRandomCheckRefinementPercentage() {
  const max = 90;
  const min = 10;
  const increment = 10; // 10 percent
  const rangeMax = ((max - min) / increment);
  return ((getRandomIntInRange(0, rangeMax) * increment) + min) / 100;
}

function getRandomSimulation() {
  const sprintDayCount = generateRandomSprintDayCount();
  const regressionTestDayCount = generateRandomRegressionTestDayCount(
    sprintDayCount
  );
  const dayStartTime = generateRandomDayStartTime();
  const programmerCount = generateRandomProgrammerCount();
  const testerCount = generateRandomTesterCount(programmerCount);
  const maxInitialDevTime = generateRandomMaxInitialDevTime();
  const maxFullRunCheckTime = generateRandomMaxFullRunCheckTime();
  const maxQAAutomationTime = generateRandomQAAutomationTime();
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
    maxQAAutomationTime,
    averagePassBackCount,
    checkRefinementPercentage,
  );
}

interface MetricReference {
    [value: number]: Simulation[];
  }


interface SimulationConfigInputs {
  sprintDayCount: number;
  regressionTestDayCount: number;
  dayStartTime: number;
  programmerCount: number;
  testerCount: number;
  maxInitialProgrammerWorkTimeInHours: number;
  maxFullRunTesterWorkTimeInHours: number;
  maxQaAutomationTime: number;
  averagePassBackCount: number;
  checkRefinement: number;
}

interface MetricRecord extends SimulationConfigInputs {
  programmerToTesterRatio: string;
  peekProgTimeToPeekCheckTimeRatio: string;
  peekCheckTimeToPeekAutomationTimeRatio: string;
  peekProgTimeToPeekAutomationTimeRatio: string;
  percentageOfSprintTicketsDone: number;
  percentageOfSprintTicketsAutomated: number;
  percentageOfProgrammerTimeSpentProgramming: number;
  percentageOfProgrammingTimeForRedundantProgramming: number;
  percentageOfProgrammingTimeForProductiveProgramming: number;
  percentageOfProgrammingTimeForFluffProgramming: null | number;
  percentageOfProgrammingTimeForNonFluffProgramming: null | number;
  percentageOfProgrammerTimeSpentCodeReview: number;
  percentageOfCodeReviewTimeForRedundantCodeReview: null | number;
  percentageOfCodeReviewTimeForProductiveCodeReview: null | number;
  percentageOfCodeReviewTimeForFluffCodeReview: null | number;
  percentageOfCodeReviewTimeForNonFluffCodeReview: null | number;
  percentageOfTesterTimeSpentChecking: number;
  percentageOfTesterTimeSpentAutomating: number;
  percentageOfTesterTimeSpentDoingNothing: number;
  percentageOfCheckingTimeForFluffChecking: null | number;
  percentageOfCheckingTimeForNonFluffChecking: null | number;
  percentageOfCheckingTimeForRedundantChecking: null | number;
  percentageOfCheckingTimeForProductiveChecking: null | number;
  projectedDeadlockAsSprintCount: number | null;
  projectedDeadlockAsNumberOfDays: number | null;
  growthRate: number;
}

const computedConfigComboKeyToCompFunc = {
  programmerToTesterRatio: (simulation: Simulation) => calculateRatio({ num_1: simulation.programmerCount, num_2: simulation.testerCount }),
  peekProgTimeToPeekCheckTimeRatio: (simulation: Simulation) => calculateRatio({ num_1: simulation.maxInitialProgrammerWorkTimeInHours, num_2: simulation.maxFullRunTesterWorkTimeInHours }),
  peekCheckTimeToPeekAutomationTimeRatio: (simulation: Simulation) => calculateRatio({ num_1: simulation.maxFullRunTesterWorkTimeInHours, num_2: simulation.maxQaAutomationTime }),
  peekProgTimeToPeekAutomationTimeRatio: (simulation: Simulation) => calculateRatio({ num_1: simulation.maxInitialProgrammerWorkTimeInHours, num_2: simulation.maxQaAutomationTime }),
}
function calculateRatio({ num_1, num_2 }: { num_1: number; num_2: number; }): string {
  for(let num = num_2; num > 1; num--) {
      if((num_1 % num) == 0 && (num_2 % num) == 0) {
          num_1=num_1/num;
          num_2=num_2/num;
      }
  }
  const ratio = num_1+":"+num_2;
  return ratio;
}

function generateRecordForSimulation(simulation: Simulation): MetricRecord {
  const finalMinuteWorkerData = simulation.workerDataForDayTime[simulation.workerDataForDayTime.length - 1];
  const finalCumulativeMinutes = finalMinuteWorkerData.cumulativeMinutes;
  const finalTesterWorkerData = finalMinuteWorkerData.workers.filter((worker, i) => i >= simulation.programmerCount);
  const percentageOfSprintTicketsDone = simulation.doneStack.length / simulation.ticketFactory.ticketsMade;
  const percentageOfSprintTicketsAutomated = simulation.automatedStack.length / simulation.ticketFactory.ticketsMade;
  // Programming
  const percentageOfProgrammerTimeSpentProgramming = finalCumulativeMinutes.programming / (simulation.programmerCount * simulation.totalSimulationMinutes);
  const percentageOfProgrammingTimeForProductiveProgramming = finalCumulativeMinutes.productiveProgrammingTicketWorkMinutes / finalCumulativeMinutes.programming;
  const percentageOfProgrammingTimeForRedundantProgramming = finalCumulativeMinutes.redundantProgrammingTicketWorkMinutes / finalCumulativeMinutes.programming;
  const percentageOfProgrammingTimeForFluffProgramming = finalCumulativeMinutes.fluffProgramming / finalCumulativeMinutes.programming;
  const percentageOfProgrammingTimeForNonFluffProgramming = finalCumulativeMinutes.nonFluffProgramming / finalCumulativeMinutes.programming;
  // code review
  const percentageOfProgrammerTimeSpentCodeReview = finalCumulativeMinutes.codeReview / (simulation.programmerCount * simulation.totalSimulationMinutes);
  const percentageOfCodeReviewTimeForProductiveCodeReview = finalCumulativeMinutes.codeReview === 0 ? null : finalCumulativeMinutes.productiveCodeReviewTicketWorkMinutes / finalCumulativeMinutes.codeReview;
  const percentageOfCodeReviewTimeForRedundantCodeReview = finalCumulativeMinutes.codeReview === 0 ? null : finalCumulativeMinutes.redundantCodeReviewTicketWorkMinutes / finalCumulativeMinutes.codeReview;
  const percentageOfCodeReviewTimeForFluffCodeReview = finalCumulativeMinutes.codeReview === 0 ? null : finalCumulativeMinutes.fluffCodeReview / finalCumulativeMinutes.codeReview;
  const percentageOfCodeReviewTimeForNonFluffCodeReview = finalCumulativeMinutes.codeReview === 0 ? null : finalCumulativeMinutes.nonFluffCodeReview / finalCumulativeMinutes.codeReview;
  // checking
  const percentageOfTesterTimeSpentChecking = finalCumulativeMinutes.checking / (simulation.testerCount * simulation.totalSimulationMinutes);
  const percentageOfTesterTimeSpentAutomating = finalCumulativeMinutes.automation / (simulation.testerCount * simulation.totalSimulationMinutes);
  const percentageOfTesterTimeSpentDoingNothing = finalTesterWorkerData.reduce((acc, worker) => acc + worker.nothing, 0) / (simulation.testerCount * simulation.totalSimulationMinutes);
  const percentageOfCheckingTimeForProductiveChecking = finalCumulativeMinutes.checking === 0 ? null : finalCumulativeMinutes.productiveCheckingTicketWorkMinutes / finalCumulativeMinutes.checking;
  const percentageOfCheckingTimeForRedundantChecking = finalCumulativeMinutes.checking === 0 ? null : finalCumulativeMinutes.redundantCheckingTicketWorkMinutes / finalCumulativeMinutes.checking;
  const percentageOfCheckingTimeForFluffChecking = finalCumulativeMinutes.checking === 0 ? null : finalCumulativeMinutes.fluffChecking / finalCumulativeMinutes.checking;
  const percentageOfCheckingTimeForNonFluffChecking = finalCumulativeMinutes.checking === 0 ? null : finalCumulativeMinutes.nonFluffChecking / finalCumulativeMinutes.checking;
  // deadlock
  const projectedDeadlockAsSprintCount = simulation.projectedSprintCountUntilDeadlock;
  let projectedDeadlockAsNumberOfDays;
  if (simulation.projectedSprintCountUntilDeadlock === null) {
    projectedDeadlockAsNumberOfDays = null;
  } else {
    projectedDeadlockAsNumberOfDays = simulation.projectedSprintCountUntilDeadlock * simulation.sprintDayCount;
  }
  const record: MetricRecord = {
    sprintDayCount: simulation.sprintDayCount,
    regressionTestDayCount: simulation.regressionTestDayCount,
    dayStartTime: simulation.dayStartTime,
    programmerCount: simulation.programmerCount,
    testerCount: simulation.testerCount,
    maxInitialProgrammerWorkTimeInHours: simulation.maxInitialProgrammerWorkTimeInHours,
    maxFullRunTesterWorkTimeInHours: simulation.maxFullRunTesterWorkTimeInHours,
    maxQaAutomationTime: simulation.maxQaAutomationTime,
    averagePassBackCount: simulation.averagePassBackCount,
    checkRefinement: simulation.checkRefinement,
    programmerToTesterRatio: computedConfigComboKeyToCompFunc.programmerToTesterRatio(simulation),
    peekProgTimeToPeekCheckTimeRatio: computedConfigComboKeyToCompFunc.peekProgTimeToPeekCheckTimeRatio(simulation),
    peekCheckTimeToPeekAutomationTimeRatio: computedConfigComboKeyToCompFunc.peekCheckTimeToPeekAutomationTimeRatio(simulation),
    peekProgTimeToPeekAutomationTimeRatio: computedConfigComboKeyToCompFunc.peekProgTimeToPeekAutomationTimeRatio(simulation),
    percentageOfSprintTicketsDone: percentageOfSprintTicketsDone,
    percentageOfSprintTicketsAutomated: percentageOfSprintTicketsAutomated,
    percentageOfProgrammerTimeSpentProgramming: percentageOfProgrammerTimeSpentProgramming,
    percentageOfProgrammingTimeForProductiveProgramming: percentageOfProgrammingTimeForProductiveProgramming,
    percentageOfProgrammingTimeForRedundantProgramming: percentageOfProgrammingTimeForRedundantProgramming,
    percentageOfProgrammingTimeForFluffProgramming: percentageOfProgrammingTimeForFluffProgramming,
    percentageOfProgrammingTimeForNonFluffProgramming: percentageOfProgrammingTimeForNonFluffProgramming,
    percentageOfProgrammerTimeSpentCodeReview: percentageOfProgrammerTimeSpentCodeReview,
    percentageOfCodeReviewTimeForProductiveCodeReview: percentageOfCodeReviewTimeForProductiveCodeReview,
    percentageOfCodeReviewTimeForRedundantCodeReview: percentageOfCodeReviewTimeForRedundantCodeReview,
    percentageOfCodeReviewTimeForFluffCodeReview: percentageOfCodeReviewTimeForFluffCodeReview,
    percentageOfCodeReviewTimeForNonFluffCodeReview: percentageOfCodeReviewTimeForNonFluffCodeReview,
    percentageOfTesterTimeSpentChecking: percentageOfTesterTimeSpentChecking,
    percentageOfTesterTimeSpentAutomating: percentageOfTesterTimeSpentAutomating,
    percentageOfTesterTimeSpentDoingNothing: percentageOfTesterTimeSpentDoingNothing,
    percentageOfCheckingTimeForProductiveChecking: percentageOfCheckingTimeForProductiveChecking,
    percentageOfCheckingTimeForRedundantChecking: percentageOfCheckingTimeForRedundantChecking,
    percentageOfCheckingTimeForFluffChecking: percentageOfCheckingTimeForFluffChecking,
    percentageOfCheckingTimeForNonFluffChecking: percentageOfCheckingTimeForNonFluffChecking,
    projectedDeadlockAsSprintCount: projectedDeadlockAsSprintCount,
    projectedDeadlockAsNumberOfDays: projectedDeadlockAsNumberOfDays,
    growthRate: simulation.growthRate,
  }
  return record;
}

const configKeys = [
  "sprintDayCount",
  "regressionTestDayCount",
  "dayStartTime",
  "programmerCount",
  "testerCount",
  "maxInitialProgrammerWorkTimeInHours",
  "maxFullRunTesterWorkTimeInHours",
  "maxQaAutomationTime",
  "averagePassBackCount",
  "checkRefinement",
]
class MetricCollectionManager {
  public records: MetricRecord[] = [];
  // public sprintDayCount: MetricCsvRecord[] = [];
  // public regressionTestDayCount: MetricCsvRecord[] = [];
  // public dayStartTime: MetricCsvRecord[] = [];
  // public programmerCount: MetricCsvRecord[] = [];
  // public testerCount: MetricCsvRecord[] = [];
  // public maxInitialProgrammerWorkTimeInHours: MetricCsvRecord[] = [];
  // public maxFullRunTesterWorkTimeInHours: MetricCsvRecord[] = [];
  // public averagePassBackCount: MetricCsvRecord[] = [];
  // public checkRefinement: MetricCsvRecord[] = [];
  ingestSimulation(simulation: Simulation) {
    // this.prepCollectionsForInputValues(simulation);
    const record: MetricRecord = generateRecordForSimulation(simulation);
    // for (let inputName in this) {
    //   const inputValue = simulation[inputName as keyof Simulation] as number;
    //   const csvRecord: MetricCsvRecord = {
    //     inputValue: inputValue,
    //     ...record,
    //   }
    //   this[inputName as keyof MetricCollection][inputValue as keyof MetricCollectionForInputValue].push(csvRecord);
    // }
    this.records.push(record);
  }
}


const csvWriter = createCsvWriter({
  path: 'sim.csv',
  header: [
    {id: 'sprintDayCount', title: 'sprintDayCount'},
    {id: 'regressionTestDayCount', title: 'regressionTestDayCount'},
    {id: 'dayStartTime', title: 'dayStartTime'},
    {id: 'programmerCount', title: 'programmerCount'},
    {id: 'testerCount', title: 'testerCount'},
    {id: 'maxInitialProgrammerWorkTimeInHours', title: 'maxInitialProgrammerWorkTimeInHours'},
    {id: 'maxFullRunTesterWorkTimeInHours', title: 'maxFullRunTesterWorkTimeInHours'},
    {id: 'averagePassBackCount', title: 'averagePassBackCount'},
    {id: 'checkRefinement', title: 'checkRefinement'},
    {id: 'programmerToTesterRatio', title: 'programmerToTesterRatio'},
    {id: 'peekProgTimeToPeekCheckTimeRatio', title: 'peekProgTimeToPeekCheckTimeRatio'},
    {id: 'peekCheckTimeToPeekAutomationTimeRatio', title: 'peekCheckTimeToPeekAutomationTimeRatio'},
    {id: 'peekProgTimeToPeekAutomationTimeRatio', title: 'peekProgTimeToPeekAutomationTimeRatio'},
    {id: 'percentageOfSprintTicketsDone', title: 'percentageOfSprintTicketsDone'},
    {id: 'percentageOfSprintTicketsAutomated', title: 'percentageOfSprintTicketsAutomated'},
    {id: 'percentageOfProgrammerTimeSpentProgramming', title: 'percentageOfProgrammerTimeSpentProgramming'},
    {id: 'percentageOfProgrammingTimeForProductiveProgramming', title: 'percentageOfProgrammingTimeForProductiveProgramming'},
    {id: 'percentageOfProgrammingTimeForRedundantProgramming', title: 'percentageOfProgrammingTimeForRedundantProgramming'},
    {id: 'percentageOfProgrammingTimeForFluffProgramming', title: 'percentageOfProgrammingTimeForFluffProgramming'},
    {id: 'percentageOfProgrammingTimeForNonFluffProgramming', title: 'percentageOfProgrammingTimeForNonFluffProgramming'},
    {id: 'percentageOfProgrammerTimeSpentCodeReview', title: 'percentageOfProgrammerTimeSpentCodeReview'},
    {id: 'percentageOfCodeReviewTimeForProductiveCodeReview', title: 'percentageOfCodeReviewTimeForProductiveCodeReview'},
    {id: 'percentageOfCodeReviewTimeForRedundantCodeReview', title: 'percentageOfCodeReviewTimeForRedundantCodeReview'},
    {id: 'percentageOfCodeReviewTimeForFluffCodeReview', title: 'percentageOfCodeReviewTimeForFluffCodeReview'},
    {id: 'percentageOfCodeReviewTimeForNonFluffCodeReview', title: 'percentageOfCodeReviewTimeForNonFluffCodeReview'},
    {id: 'percentageOfTesterTimeSpentChecking', title: 'percentageOfTesterTimeSpentChecking'},
    {id: 'percentageOfCheckingTimeForProductiveChecking', title: 'percentageOfCheckingTimeForProductiveChecking'},
    {id: 'percentageOfCheckingTimeForRedundantChecking', title: 'percentageOfCheckingTimeForRedundantChecking'},
    {id: 'percentageOfCheckingTimeForFluffChecking', title: 'percentageOfCheckingTimeForFluffChecking'},
    {id: 'percentageOfCheckingTimeForNonFluffChecking', title: 'percentageOfCheckingTimeForNonFluffChecking'},
    {id: 'projectedDeadlockAsSprintCount', title: 'projectedDeadlockAsSprintCount'},
    {id: 'projectedDeadlockAsNumberOfDays', title: 'projectedDeadlockAsNumberOfDays'},
    {id: 'growthRate', title: 'growthRate'},
  ]
});

// const records: MetricRecord[] = [];
var records: number = 0;
const recordCap = 10000;
// const recordCap = 1000;
const writePromises: Promise<void>[] = [];

interface MetricRecordMessage {
  record: MetricRecord;
}

interface SimulationMessage {
  sim: Simulation;
}

async function messageHandler(msg: any) {
  if (msg.sim) {
    fs.writeFile(path.join(__dirname, `${Math.random()}.json`), msg.sim + '\n' + JSON.stringify(msg.error.message), (err) => {
        if (err) {
            return console.log(err);
        }
    });
}
  if (msg.record) {
    const writeP = csvWriter.writeRecords([msg.record]);
    writePromises.push(writeP);
    const indexOfP = writePromises.indexOf(writeP);
    if (indexOfP !== 0) {
      const previousP = writePromises[indexOfP - 1];
      await previousP;
    }
    await writeP;
    records++;
    writePromises.shift();
    // records.push(msg.record);
    console.log(`Total simulations so far: ${records}`);
  }
}

interface WorkersFinished {
  [workerId: string]: boolean;
}
const workersFinished: WorkersFinished = {}

var newSim = getRandomSimulation();
newSim.simulate();

for (var i = 0; i < 1000; i++) {
  console.log(i);
  var newSim = getRandomSimulation();
  newSim.simulate();
  console.log(newSim.growthRate)
}
throw new Error();

if (cluster.isMaster) {

  // const numCPUs = require('os').cpus().length;
  for (let i = 0; i < numCPUs - 1; i++) {
    cluster.fork();
  }

  for (const id in cluster.workers) {
    workersFinished[id] = false;
    cluster.workers[id]!.on('message', messageHandler);
  }
  cluster.on('message', messageHandler);
  cluster.on('exit', (worker, code, signal) => {
    workersFinished[worker.id] = true;
    if (records < recordCap) {
      cluster.fork();
      for (const id in cluster.workers) {
        if (!(workersFinished.hasOwnProperty(id))){
          workersFinished[id] = false;
          cluster.workers[id]!.on('message', messageHandler);
        }
      }
    }
  });
  cluster.on('error', (worker, code, signal) => {
    for (let id in workersFinished) {
      workersFinished[id] = true;
    }
    for (const id in cluster.workers) {
      cluster.workers[id]!.kill();
    }
  });
} else {
  console.log(`Worker ${process.pid} started`);
  generateSims(process);
  process.disconnect();
}


// function generateSims(process: NodeJS.Process) {
//   for (let i = 0; i < 10; i++) {
//     let newSim = getRandomSimulation();
//     newSim.simulate();
//     const recordMessage: MetricRecordMessage = {record: generateRecordForSimulation(newSim)};
//     process.send!(recordMessage);
//   }
// }
function generateSims(process: NodeJS.Process) {
  for (var i = 0; i < 10; i++) {
      var newSim = getRandomSimulation();
      try {
          newSim.simulate();
      } catch (err) {
          var simMessage = { sim: genSimText(newSim), error: err };
          process.send!(simMessage);
          throw err;
      }
      var recordMessage = { record: generateRecordForSimulation(newSim) };
      process.send!(recordMessage);
  }
}

function genSimText(sim: Simulation) {
  const ew = sim.getWorkerWithEarliestUpcomingCheckIn();
  let text = ''
  text += '\n';
  text += `current day time: ${sim.currentDayTime}`;
  text += '\n';
  text += `ew: ${ew.name}`;
  text += '\n';
  text += `ew schedule items:`;
  text += '\n';
  text += ew.schedule.daySchedules[sim.currentDay].items.reduce((acc, i) => acc + ',' + JSON.stringify(i), '');
  text += '\n';
  text += ew.schedule.daySchedules[sim.currentDay].availableTimeSlots.reduce((acc, i) => acc + ',' + JSON.stringify(i), '');
  for (let p of sim.programmers) {
      text += '\n';
      text += `${p.name} next checking: ${p.nextCheckInTime}`;
      text += '\n';
      text += `${p.name} next avail checking: ${p.nextAvailabilityCheckIn}`;
      text += '\n';
      text += `${p.name} next iter complete checking: ${p.nextWorkIterationCompletionCheckIn}`;
      if (p.nextCheckInTime > 0) {
          text += '\n';
          text += `${p.name} schedule for that day`;
          text += '\n';
          text += p.schedule.daySchedules[Math.floor(p.nextCheckInTime / 480)].items.reduce((acc, i) => acc + ',' + JSON.stringify(i), '');
          text += '\n';
          text += p.schedule.daySchedules[Math.floor(p.nextCheckInTime / 480)].availableTimeSlots.reduce((acc, i) => acc + ',' + JSON.stringify(i), '');
          text += '\n';
          text += p.schedule.daySchedules[Math.floor(p.nextCheckInTime / 480) + 1].items.reduce((acc, i) => acc + ',' + JSON.stringify(i), '');
          text += '\n';
          text += p.schedule.daySchedules[Math.floor(p.nextCheckInTime / 480) + 1].availableTimeSlots.reduce((acc, i) => acc + ',' + JSON.stringify(i), '');
      }
  }
  text += '\n';
  text += "stacks";
  text += '\n';
  text += sim.qaStack.length;
  text += '\n';
  text += sim.needsAutomationStack.length;
  text += '\n';
  text += JSON.stringify(sim.qaStack);
  text += '\n';
  text += JSON.stringify(sim.needsAutomationStack);
  text += '\n';
  text += sim.noAvailableWorkForTesters;
  text += '\n';
  text += ew.nextWorkIterationCompletionCheckIn;
  text += '\n';
  text += ew.nextAvailabilityCheckIn;
  text += '\n';
  text += ew.nextWorkIterationCompletionCheckIn === null;
  text += '\n';
  text += sim.allProgrammersAreDoneForTheSprint;
  text += '\n';
  text += sim.testers.map(t => t.nextCheckInTime);
  text += '\n';
  text += sim.testers.map(t => t.nextCheckInTime).filter(t => t > 0).every(t => t === sim.currentDayTime);
  text += '\n';
  const availableTesters = sim.testers.filter((t) => t.nextCheckInTime > 0);
  text += JSON.stringify(availableTesters);
  text += '\n';
  text += availableTesters.map(t => t.nextCheckInTime);
  text += '\n';
  text += availableTesters.map(t => t.nextWorkIterationCompletionCheckIn);
  text += '\n';
  text += availableTesters.map(t => t.nextAvailabilityCheckIn);
  text += '\n';
  text += availableTesters.map(t => sim.getHighestPriorityCheckingWorkIndexForTester(t));
  text += '\n';
  text += sim.getHighestPriorityAutomationIndex();
  text += '\n';
  text += availableTesters.map(t => t.tickets.map((t) => t.ticketNumber));
  text += '\n';
  const unavailableTesters = sim.testers.filter((t) => t.nextCheckInTime < 0);
  text += unavailableTesters.map(t => t.tickets.map((t) => t.ticketNumber));
  text += '\n';
  text += '----------';
  text += '\n';
  text += JSON.stringify(unavailableTesters);
  text += '\n';
  const unclaimableTicketNumbers = unavailableTesters
    .reduce((acc: any[], t) => acc.concat(t.tickets), [])
    .map((ticket) => ticket.ticketNumber);
  text += JSON.stringify(unclaimableTicketNumbers);
  text += '\n';
  const availableTicketNumbers = [...sim.qaStack, ...sim.needsAutomationStack].map((ticket) => ticket.ticketNumber);
  text += JSON.stringify(availableTicketNumbers);
  text += '\n';
  const result = availableTicketNumbers.filter((num) => !unclaimableTicketNumbers.includes(num)).length === 0;;
  text += JSON.stringify(result);
  text += '\n';

  return text;
}
