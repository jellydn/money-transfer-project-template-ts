import assert from 'assert'
import { WorkflowFailedError } from '@temporalio/client'
import { TestWorkflowEnvironment } from '@temporalio/testing'
import { DefaultLogger, LogEntry, Runtime, Worker } from '@temporalio/worker'
import { afterAll, beforeAll, describe, it, vi } from 'vitest'

import * as activities from '../src/activities'
import type { PaymentDetails } from '../src/shared'
import { moneyTransfer } from '../src/workflows'

let testEnv: TestWorkflowEnvironment

vi.setConfig({ testTimeout: 5_000_000 })

beforeAll(async function () {
  // Use console.log instead of console.error to avoid red output
  // Filter INFO log messages for clearer test output
  Runtime.install({
    logger: new DefaultLogger('WARN', (entry: LogEntry) =>
      console.log(`[${entry.level}]`, entry.message),
    ),
  })
  testEnv = await TestWorkflowEnvironment.createLocal()
}, 30_000)

afterAll(async () => {
  await testEnv?.teardown()
})

describe('Money Transfer workflow', () => {
  it('successfully withdraws and deposits given existing bank account information', async () => {
    const { client, nativeConnection } = testEnv
    const taskQueue = 'test'

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../src/workflows.ts'),
      activities: {
        withdraw: async () => 'w1234567890',
        deposit: async () => 'd1234567890',
      },
    })

    const details: PaymentDetails = {
      amount: 400,
      sourceAccount: '85-150',
      targetAccount: '43-812',
      referenceId: '12345',
    }

    await worker.runUntil(async () => {
      const result = await client.workflow.execute(moneyTransfer, {
        args: [details],
        workflowId: 'money-transfer-test-workflow',
        taskQueue,
      })

      assert.equal(
        result,
        'Transfer complete (transaction IDs: w1234567890, d1234567890)',
      )
    })
  })

  it('moneyTransfer deposit fails if the target account number does not exist', async () => {
    const { client, nativeConnection } = testEnv
    const taskQueue = 'test'

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../src/workflows.ts'),
      activities,
    })

    const invalidDetails: PaymentDetails = {
      amount: 400,
      sourceAccount: '85-150',
      targetAccount: '401-812',
      referenceId: '12345',
    }

    let isWorkflowFailedError = false
    try {
      await worker.runUntil(async () => {
        await client.workflow.execute(moneyTransfer, {
          args: [invalidDetails],
          workflowId: 'money-transfer-test-workflow',
          taskQueue,
        })
      })
    } catch (err) {
      if (err instanceof WorkflowFailedError) {
        isWorkflowFailedError = true
      }
    }
    assert.equal(isWorkflowFailedError, true)
  })

  it('moneyTransfer withdrawal fails if the source account number does not exist', async () => {
    const { client, nativeConnection } = testEnv
    const taskQueue = 'test'

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../src/workflows.ts'),
      activities,
    })

    const invalidDetails: PaymentDetails = {
      amount: 400,
      sourceAccount: '801-150',
      targetAccount: '43-812',
      referenceId: '12345',
    }

    let isWorkflowFailedError = false
    try {
      await worker.runUntil(async () => {
        await client.workflow.execute(moneyTransfer, {
          args: [invalidDetails],
          workflowId: 'money-transfer-test-workflow',
          taskQueue,
        })
      })
    } catch (err) {
      if (err instanceof WorkflowFailedError) {
        isWorkflowFailedError = true
      }
    }
    assert.equal(isWorkflowFailedError, true)
  })

  it('moneyTransfer withdrawal fails if the amount being withdrawn is greater than the amount that the bank has', async () => {
    const { client, nativeConnection } = testEnv
    const taskQueue = 'test'

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../src/workflows.ts'),
      activities,
    })

    const invalidDetails: PaymentDetails = {
      amount: 4000,
      sourceAccount: '801-150',
      targetAccount: '43-812',
      referenceId: '12345',
    }

    let isWorkflowFailedError = false
    try {
      await worker.runUntil(async () => {
        await client.workflow.execute(moneyTransfer, {
          args: [invalidDetails],
          workflowId: 'money-transfer-test-workflow',
          taskQueue,
        })
      })
    } catch (err) {
      if (err instanceof WorkflowFailedError) {
        isWorkflowFailedError = true
      }
    }
    assert.equal(isWorkflowFailedError, true)
  })
})
