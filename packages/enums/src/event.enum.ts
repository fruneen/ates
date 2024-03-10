export enum EventName {
  // Account
  AccountCreated = 'account_created',

  // Task
  TaskCreated = 'task_created',
  TaskAssigned = 'task_assigned',
  TaskCompleted = 'task_completed',

  // Transaction
  TransactionApplied = 'transaction_applied',

  // Payment
  PaymentCompleted = 'payment_completed',
}

export enum TopicName {
  // Account
  AccountsStream = 'accounts-stream',

  // Task
  TasksStream = 'tasks-stream',
  TasksLifecycle = 'tasks-lifecycle',

  // Transaction
  TransactionsLifecycle = 'transactions-lifecycle',

  // Payment
  PaymentLifecycle = 'payment-lifecycle',
}