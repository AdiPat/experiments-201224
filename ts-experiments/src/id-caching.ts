/**
 * Author: Aditya Patange (AdiPat)
 * Date: 24th December 2020
 * Research Study: ID Generation Performance Comparison
 *
 * Goals:
 * - Compare the performance of normal UUID generation with cached UUID generation.
 * - Measure the time taken to generate IDs in both scenarios.
 * - Determine the impact of regenerating the ID pool on performance.
 *
 * Objectives:
 * - Implement two ID generators: NormalIdGenerator and CachedIdGenerator.
 * - Run multiple trials to generate a large number of IDs.
 * - Calculate the average time taken to generate each ID in microseconds.
 * - Print a comparison table showing the performance difference.
 *
 * Findings:
 * - Cached ID generation is generally faster than normal UUID generation.
 * - The main result is that if the ID pool always has a value, cached generation is faster.
 * - In the case of regenerating the ID pool, the average time dips due to the overhead of regeneration.
 *
 */

import { v4 as uuidv4 } from "uuid";

interface IdGenerator {
  generateId(): string;
}

class NormalIdGenerator implements IdGenerator {
  generateId() {
    return uuidv4();
  }
}

class CachedIdGenerator implements IdGenerator {
  private ID_POOL_SIZE = 1000000; // assuming our ID pool always has a value and there's some background mechanism to reload it when it's empty
  private idPool: string[];

  constructor() {
    this.idPool = [];
    this.regenerateIdPool();
  }

  generateId(): string {
    const id = this.idPool.pop();

    if (!id) {
      this.regenerateIdPool();
      return uuidv4();
    }

    return id;
  }

  private async regenerateIdPool() {
    this.idPool = [];
    for (let i = 0; i < this.ID_POOL_SIZE; i++) {
      const id = uuidv4();
      this.idPool.push(id);
    }
  }
}

const ID_COUNT = 100000;
const MICROSECONDS_CONVERSION = 1000;

const runTrials = (idGenerator: IdGenerator, trials: number) => {
  const times: number[] = [];
  for (let i = 0; i < trials; i++) {
    for (let j = 0; j < ID_COUNT; j++) {
      const idStartTime = performance.now();
      idGenerator.generateId();
      const idEndTime = performance.now();
      times.push((idEndTime - idStartTime) * MICROSECONDS_CONVERSION); // Convert to microseconds
    }
  }
  const averageTimes = [];
  for (let i = 0; i < trials; i++) {
    const trialTimes = times.slice(i * ID_COUNT, (i + 1) * ID_COUNT);
    const averageTime =
      trialTimes.reduce((a, b) => a + b, 0) / trialTimes.length;
    averageTimes.push(averageTime);
  }
  return averageTimes;
};

const printComparisonTable = (normalTimes: number[], cachedTimes: number[]) => {
  const table = [];
  for (let i = 0; i < normalTimes.length; i++) {
    const normalTime = normalTimes[i];
    const cachedTime = cachedTimes[i];
    const difference = normalTime / cachedTime;
    const differenceLabel =
      difference > 1
        ? `${difference.toFixed(2)}x faster`
        : `${(1 / difference).toFixed(2)}x slower`;
    table.push({
      Trial: i + 1,
      "Normal ID Generation": `${normalTime.toFixed(2)}µs`,
      "Cached ID Generation": `${cachedTime.toFixed(2)}µs`,
      Difference: differenceLabel,
    });
  }
  console.table(table);
};

const runExperiment = (trials: number) => {
  const normalIdGenerator = new NormalIdGenerator();
  const cachedIdGenerator = new CachedIdGenerator();

  console.log("Running trials for Normal ID generation...");
  const normalTimes = runTrials(normalIdGenerator, trials);

  console.log("Running trials for Cached ID generation...");
  const cachedTimes = runTrials(cachedIdGenerator, trials);

  printComparisonTable(normalTimes, cachedTimes);
};

runExperiment(5);
