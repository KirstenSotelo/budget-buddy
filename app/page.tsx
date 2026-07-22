"use client";

import { type FormEvent, useMemo, useState } from "react";

type View = "Today" | "Spend" | "Save" | "Income" | "Coach";
type MonthId = "2025-07" | "2025-08" | "2025-09";
type ExpenseType = "Daily" | "Fixed";
type Mood = "Worth it" | "Needed" | "Oops";
type BillFrequency = "Weekly" | "Biweekly" | "Monthly" | "Yearly";
type BillKind = "Essential" | "Optional";
type BillMonthStatus = "Upcoming" | "Paid" | "Skipped";
type IncomeFrequency = "One-time" | "Weekly" | "Biweekly" | "Monthly";
type IncomeType = "Paycheque" | "Government" | "Side gig" | "Gift" | "Refund" | "Other";

type Expense = {
  merchant: string;
  category: string;
  amount: number;
  date: string;
  type: ExpenseType;
  monthId: MonthId;
  mood: Mood;
};

type Goal = {
  name: string;
  saved: number;
  target: number;
  monthly: number;
  deadline: string;
  boost: string;
};

type SavingAction = {
  amount: number;
  goal: string;
  monthId: MonthId;
  date: string;
};

type Bill = {
  id: string;
  name: string;
  amount: number;
  due: string;
  frequency: BillFrequency;
  category: string;
  autopay: boolean;
  kind: BillKind;
  statuses: Partial<Record<MonthId, BillMonthStatus>>;
};

type IncomeEntry = {
  source: string;
  amount: number;
  date: string;
  type: IncomeType;
  frequency: IncomeFrequency;
  monthId: MonthId;
};

type Modal = "expense" | "saving" | "bill" | "income" | null;

type BudgetCategory = {
  name: string;
  spent: number;
  limit: number;
  tone: "green" | "blue" | "warm" | "red";
};

type MonthSnapshot = {
  monthName: string;
  monthLabel: string;
  asOf: string;
  income: number;
  spentSoFar: number;
  savingsSetAside: number;
  daysLeft: number;
  categories: BudgetCategory[];
  insight: string;
};

const startingExpenses: Expense[] = [
  { merchant: "Rent", category: "Housing", amount: 1450, date: "Aug 1, 2025", type: "Fixed", monthId: "2025-08", mood: "Needed" },
  { merchant: "Phone bill", category: "Bills", amount: 72, date: "Aug 4, 2025", type: "Fixed", monthId: "2025-08", mood: "Needed" },
  { merchant: "Presto reload", category: "Transit", amount: 40, date: "Aug 13, 2025", type: "Daily", monthId: "2025-08", mood: "Needed" },
  { merchant: "Lunch near campus", category: "Food", amount: 18.75, date: "Aug 13, 2025", type: "Daily", monthId: "2025-08", mood: "Worth it" },
  { merchant: "Grocery run", category: "Food", amount: 64.3, date: "Aug 12, 2025", type: "Daily", monthId: "2025-08", mood: "Needed" },
  { merchant: "Coffee", category: "Food", amount: 6.2, date: "Aug 11, 2025", type: "Daily", monthId: "2025-08", mood: "Worth it" },
  { merchant: "Movie night", category: "Fun", amount: 32, date: "Aug 9, 2025", type: "Daily", monthId: "2025-08", mood: "Worth it" },
  { merchant: "Clothing order", category: "Shopping", amount: 126, date: "Aug 12, 2025", type: "Daily", monthId: "2025-08", mood: "Oops" },
  { merchant: "Birthday dinner", category: "Food", amount: 78, date: "Aug 10, 2025", type: "Daily", monthId: "2025-08", mood: "Worth it" },
];

const startingGoals: Goal[] = [
  {
    name: "Emergency fund",
    saved: 920,
    target: 2000,
    monthly: 180,
    deadline: "Dec 31",
    boost: "Send leftover transit money here first.",
  },
  {
    name: "Japan trip",
    saved: 1360,
    target: 3000,
    monthly: 320,
    deadline: "May 15",
    boost: "Round up food purchases for this goal.",
  },
  {
    name: "New laptop",
    saved: 480,
    target: 1500,
    monthly: 140,
    deadline: "Black Friday",
    boost: "Move 20% of unused fun money here.",
  },
  {
    name: "Concert tickets",
    saved: 80,
    target: 350,
    monthly: 100,
    deadline: "Nov 15",
    boost: "Put one skipped takeout order toward the tickets.",
  },
];

const monthOrder: MonthId[] = ["2025-07", "2025-08", "2025-09"];

const monthData: Record<MonthId, MonthSnapshot> = {
  "2025-07": {
    monthName: "July",
    monthLabel: "July 2025",
    asOf: "Jul 31, 2025",
    income: 3100,
    spentSoFar: 2050,
    savingsSetAside: 250,
    daysLeft: 0,
    categories: [
      { name: "Food", spent: 388, limit: 420, tone: "warm" },
      { name: "Transit", spent: 118, limit: 140, tone: "green" },
      { name: "Shopping", spent: 132, limit: 220, tone: "blue" },
      { name: "Fun", spent: 149, limit: 160, tone: "warm" },
    ],
    insight: "July closed with savings protected and money left over. Food and fun came closest to their limits.",
  },
  "2025-08": {
    monthName: "August",
    monthLabel: "August 2025",
    asOf: "Aug 13, 2025",
    income: 3200,
    spentSoFar: 1887.25,
    savingsSetAside: 280,
    daysLeft: 18,
    categories: [
      { name: "Food", spent: 302, limit: 420, tone: "warm" },
      { name: "Transit", spent: 96, limit: 140, tone: "green" },
      { name: "Shopping", spent: 188, limit: 220, tone: "red" },
      { name: "Fun", spent: 74, limit: 160, tone: "blue" },
    ],
    insight:
      "Income covers your logged spending, savings, and remaining bills. Shopping is the category closest to its limit.",
  },
  "2025-09": {
    monthName: "September",
    monthLabel: "September 2025",
    asOf: "Sep 1, 2025",
    income: 3200,
    spentSoFar: 0,
    savingsSetAside: 280,
    daysLeft: 30,
    categories: [
      { name: "Food", spent: 0, limit: 420, tone: "green" },
      { name: "Transit", spent: 0, limit: 140, tone: "green" },
      { name: "Shopping", spent: 0, limit: 220, tone: "blue" },
      { name: "Fun", spent: 0, limit: 160, tone: "blue" },
    ],
    insight: "September is ready to plan. Your recurring bills and savings are already visible before spending starts.",
  },
};

const quests = [
  { name: "No-spend lunch day", reward: "$15 boost", status: "In progress" },
  { name: "Log 5 purchases", reward: "Cleaner insights", status: "3 of 5" },
  { name: "Save your round-ups", reward: "$8.40 ready", status: "Ready" },
];

const startingBills: Bill[] = [
  { id: "phone", name: "Phone", amount: 72, due: "4th", frequency: "Monthly", category: "Phone", autopay: true, kind: "Essential", statuses: { "2025-07": "Paid", "2025-08": "Paid", "2025-09": "Upcoming" } },
  { id: "spotify", name: "Spotify", amount: 11.99, due: "18th", frequency: "Monthly", category: "Subscription", autopay: true, kind: "Essential", statuses: { "2025-07": "Paid", "2025-08": "Upcoming", "2025-09": "Upcoming" } },
  { id: "rent", name: "Rent", amount: 1450, due: "1st", frequency: "Monthly", category: "Housing", autopay: false, kind: "Essential", statuses: { "2025-07": "Paid", "2025-08": "Paid", "2025-09": "Upcoming" } },
  { id: "massage", name: "Massage", amount: 95, due: "Choose a date", frequency: "Monthly", category: "Wellness", autopay: false, kind: "Optional", statuses: { "2025-07": "Paid", "2025-08": "Upcoming", "2025-09": "Upcoming" } },
  { id: "nails", name: "Nails", amount: 65, due: "Choose a date", frequency: "Monthly", category: "Personal care", autopay: false, kind: "Optional", statuses: { "2025-07": "Skipped", "2025-08": "Upcoming", "2025-09": "Upcoming" } },
  { id: "bike-maintenance", name: "Bike maintenance", amount: 45, due: "Any time", frequency: "Monthly", category: "Maintenance", autopay: false, kind: "Optional", statuses: { "2025-07": "Skipped", "2025-08": "Upcoming", "2025-09": "Upcoming" } },
];

const startingIncome: IncomeEntry[] = [
  { source: "Campus job", amount: 800, date: "Aug 11, 2025", type: "Paycheque", frequency: "Biweekly", monthId: "2025-08" },
  { source: "GST/HST credit", amount: 250, date: "Aug 3, 2025", type: "Government", frequency: "One-time", monthId: "2025-08" },
  { source: "Freelance poster", amount: 120, date: "Aug 8, 2025", type: "Side gig", frequency: "One-time", monthId: "2025-08" },
];

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

const exactMoney = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

function ProgressBar({
  value,
  tone = "green",
}: {
  value: number;
  tone?: BudgetCategory["tone"];
}) {
  return (
    <div className="progress-track">
      <div
        className={`progress-fill ${tone}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>("Today");
  const [monthIndex, setMonthIndex] = useState(1);
  const [expenseFilter, setExpenseFilter] = useState<"All" | ExpenseType>("All");
  const [quickEntry, setQuickEntry] = useState("bubble tea 6.50 today");
  const [spendCheck, setSpendCheck] = useState("Concert ticket");
  const [spendAmount, setSpendAmount] = useState(200);
  const [selectedMood, setSelectedMood] = useState<Mood>("Worth it");
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [addedExpenses, setAddedExpenses] = useState<Expense[]>([]);
  const [bills, setBills] = useState<Bill[]>(startingBills);
  const [addedIncome, setAddedIncome] = useState<IncomeEntry[]>([]);
  const [savingGoals, setSavingGoals] = useState<Goal[]>(startingGoals);
  const [savingActions, setSavingActions] = useState<SavingAction[]>([]);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [expenseMood, setExpenseMood] = useState<Mood>("Needed");
  const [savingAmount, setSavingAmount] = useState("");
  const [savingGoal, setSavingGoal] = useState("Emergency fund");
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("500");
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDue, setBillDue] = useState("Next Friday");
  const [billFrequency, setBillFrequency] = useState<BillFrequency>("Monthly");
  const [billCategory, setBillCategory] = useState("Subscription");
  const [billAutopay, setBillAutopay] = useState(false);
  const [billKind, setBillKind] = useState<BillKind>("Essential");
  const [incomeSource, setIncomeSource] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeType, setIncomeType] = useState<IncomeType>("Paycheque");
  const [incomeFrequency, setIncomeFrequency] = useState<IncomeFrequency>("Biweekly");
  const [incomeDate, setIncomeDate] = useState("Today");
  const [actionMessage, setActionMessage] = useState("");
  const monthId = monthOrder[monthIndex];
  const month = monthData[monthId];

  const allExpenses = useMemo(
    () => [...addedExpenses, ...startingExpenses],
    [addedExpenses],
  );

  const allIncome = useMemo(
    () => [...addedIncome, ...startingIncome],
    [addedIncome],
  );

  const visibleExpenses = useMemo(() => {
    return allExpenses.filter((expense) => {
      const matchesMonth = expense.monthId === monthId;
      const matchesType = expenseFilter === "All" || expense.type === expenseFilter;
      return matchesMonth && matchesType;
    });
  }, [allExpenses, expenseFilter, monthId]);

  const totals = useMemo(() => {
    const snapshot = monthData[monthId];
    const addedSpending = addedExpenses
      .filter((expense) => expense.monthId === monthId)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const addedSavings = savingActions
      .filter((action) => action.monthId === monthId)
      .reduce((sum, action) => sum + action.amount, 0);
    const extraIncome = addedIncome
      .filter((entry) => entry.monthId === monthId)
      .reduce((sum, entry) => sum + entry.amount, 0);
    const billsStillComing = bills
      .filter((bill) => (bill.statuses[monthId] ?? "Upcoming") === "Upcoming")
      .reduce((sum, bill) => sum + bill.amount, 0);
    const paidBillAdjustments = bills
      .filter((bill) => {
        const initialBill = startingBills.find((item) => item.id === bill.id);
        return (bill.statuses[monthId] ?? "Upcoming") === "Paid" &&
          (initialBill?.statuses[monthId] ?? "Upcoming") !== "Paid";
      })
      .reduce((sum, bill) => sum + bill.amount, 0);
    const income = snapshot.income + extraIncome;
    const spentSoFar = snapshot.spentSoFar + addedSpending + paidBillAdjustments;
    const savingsSetAside = snapshot.savingsSetAside + addedSavings;
    const safeToSpend =
      income -
      spentSoFar -
      savingsSetAside -
      billsStillComing;
    const dailyPace = snapshot.daysLeft > 0 ? Math.max(0, safeToSpend / snapshot.daysLeft) : Math.max(0, safeToSpend);

    return { ...snapshot, income, spentSoFar, savingsSetAside, billsStillComing, safeToSpend, dailyPace };
  }, [addedExpenses, addedIncome, bills, monthId, savingActions]);

  const openSavingModal = (goalName?: string) => {
    setSavingGoal(goalName ?? savingGoals[0]?.name ?? "__new");
    setSavingAmount("");
    setNewGoalName("");
    setActiveModal("saving");
  };

  const submitExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(expenseAmount);
    if (!expenseName.trim() || amount <= 0) return;

    setAddedExpenses((current) => [
      {
        merchant: expenseName.trim(),
        category: expenseCategory,
        amount,
        date: month.asOf,
        type: "Daily",
        monthId,
        mood: expenseMood,
      },
      ...current,
    ]);
    setActionMessage(`${exactMoney.format(amount)} expense added for ${expenseName.trim()}.`);
    setExpenseName("");
    setExpenseAmount("");
    setActiveModal(null);
  };

  const submitSaving = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(savingAmount);
    const targetName = savingGoal === "__new" ? newGoalName.trim() : savingGoal;
    if (!targetName || amount <= 0) return;

    if (savingGoal === "__new") {
      const target = Math.max(amount, Number(newGoalTarget) || 500);
      setSavingGoals((current) => [
        ...current,
        {
          name: targetName,
          saved: amount,
          target,
          monthly: Math.max(20, Math.round(target / 5)),
          deadline: "Choose a date",
          boost: "Your new goal is ready for its next small win.",
        },
      ]);
    } else {
      setSavingGoals((current) =>
        current.map((goal) =>
          goal.name === targetName ? { ...goal, saved: goal.saved + amount } : goal,
        ),
      );
    }

    setSavingActions((current) => [
      { amount, goal: targetName, monthId, date: month.asOf },
      ...current,
    ]);
    setActionMessage(`${exactMoney.format(amount)} added to ${targetName}.`);
    setSavingAmount("");
    setActiveModal(null);
  };

  const submitBill = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(billAmount);
    if (!billName.trim() || amount <= 0) return;

    setBills((current) => [
      {
        id: `${billName.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        name: billName.trim(),
        amount,
        due: billDue.trim() || "Upcoming",
        frequency: billFrequency,
        category: billCategory,
        autopay: billAutopay,
        kind: billKind,
        statuses: { [monthId]: "Upcoming" },
      },
      ...current,
    ]);
    setActionMessage(`${exactMoney.format(amount)} ${billFrequency.toLowerCase()} bill added for ${billName.trim()}.`);
    setBillName("");
    setBillAmount("");
    setActiveModal(null);
  };

  const submitIncome = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(incomeAmount);
    if (!incomeSource.trim() || amount <= 0) return;

    setAddedIncome((current) => [
      {
        source: incomeSource.trim(),
        amount,
        date: incomeDate.trim() || "Today",
        type: incomeType,
        frequency: incomeFrequency,
        monthId,
      },
      ...current,
    ]);
    setActionMessage(`${exactMoney.format(amount)} income added from ${incomeSource.trim()}.`);
    setIncomeSource("");
    setIncomeAmount("");
    setActiveModal(null);
  };

  const setBillStatus = (billId: string, status: BillMonthStatus) => {
    setBills((current) => current.map((bill) =>
      bill.id === billId
        ? { ...bill, statuses: { ...bill.statuses, [monthId]: status } }
        : bill,
    ));
    const bill = bills.find((item) => item.id === billId);
    const action = status === "Paid" ? "marked paid" : status === "Skipped" ? "skipped for this month" : "put back in this month";
    setActionMessage(`${bill?.name ?? "Bill"} ${action} for ${month.monthLabel}.`);
  };

  const spendVerdict = getSpendVerdict(spendAmount, totals.safeToSpend);

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Budget Buddy navigation">
        <div>
          <p className="eyebrow">Budget Buddy</p>
          <h1>Friendly money check-ins.</h1>
        </div>

        <nav className="nav-list">
          {(["Today", "Spend", "Save", "Income", "Coach"] as View[]).map((view) => (
            <button
              className={activeView === view ? "active" : ""}
              key={view}
              onClick={() => setActiveView(view)}
              type="button"
            >
              <span>{view}</span>
              <small>{navHint(view)}</small>
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <span>Design direction</span>
          <p>No shame, no spreadsheet. Quick answers, small choices, and clear next steps.</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{activeView}</p>
            <h2>{getViewTitle(activeView, month.monthLabel)}</h2>
          </div>
          <div className="topbar-actions">
            <MonthNavigator
              canGoNext={monthIndex < monthOrder.length - 1}
              canGoPrevious={monthIndex > 0}
              label={month.monthLabel}
              onNext={() => setMonthIndex((current) => Math.min(current + 1, monthOrder.length - 1))}
              onPrevious={() => setMonthIndex((current) => Math.max(current - 1, 0))}
            />
            <button className="quiet-button" onClick={() => setActiveModal("expense")} type="button">
              Add expense
            </button>
            <button className="quiet-button" onClick={() => setActiveModal("income")} type="button">
              Add income
            </button>
            <button className="ghost-button" onClick={() => openSavingModal()} type="button">
              Add savings
            </button>
          </div>
        </header>

        {actionMessage && (
          <div className="action-message" role="status">
            <span>{actionMessage} Dashboard totals updated.</span>
            <button aria-label="Dismiss message" onClick={() => setActionMessage("")} type="button">Close</button>
          </div>
        )}

        {activeView === "Today" && (
          <TodayView
            month={month}
            goals={savingGoals}
            incomeEntries={allIncome.filter((entry) => entry.monthId === monthId)}
            onAddExpense={() => setActiveModal("expense")}
            onAddIncome={() => setActiveModal("income")}
            onAddSaving={openSavingModal}
            setActiveView={setActiveView}
            savingActions={savingActions}
            spendVerdict={spendVerdict}
            totals={totals}
          />
        )}

        {activeView === "Spend" && (
          <SpendView
            expenseFilter={expenseFilter}
            bills={bills}
            monthId={monthId}
            monthLabel={month.monthLabel}
            onAddBill={() => setActiveModal("bill")}
            onSetBillStatus={setBillStatus}
            quickEntry={quickEntry}
            selectedMood={selectedMood}
            onAddExpense={() => setActiveModal("expense")}
            setSpendAmount={setSpendAmount}
            setSpendCheck={setSpendCheck}
            setExpenseFilter={setExpenseFilter}
            setQuickEntry={setQuickEntry}
            setSelectedMood={setSelectedMood}
            spendAmount={spendAmount}
            spendCheck={spendCheck}
            spendVerdict={spendVerdict}
            visibleExpenses={visibleExpenses}
          />
        )}

        {activeView === "Save" && (
          <SaveView
            goals={savingGoals}
            monthId={monthId}
            onAddSaving={openSavingModal}
            savingActions={savingActions}
            totals={totals}
          />
        )}

        {activeView === "Income" && (
          <IncomeView
            incomeEntries={allIncome}
            monthId={monthId}
            monthLabel={month.monthLabel}
            onAddIncome={() => setActiveModal("income")}
            totals={totals}
          />
        )}

        {activeView === "Coach" && (
          <CoachView monthLabel={month.monthLabel} spendCheck={spendCheck} spendVerdict={spendVerdict} totals={totals} />
        )}
      </section>

      {activeModal === "expense" && (
        <ExpenseModal
          amount={expenseAmount}
          category={expenseCategory}
          mood={expenseMood}
          name={expenseName}
          onClose={() => setActiveModal(null)}
          onSubmit={submitExpense}
          setAmount={setExpenseAmount}
          setCategory={setExpenseCategory}
          setMood={setExpenseMood}
          setName={setExpenseName}
        />
      )}

      {activeModal === "saving" && (
        <SavingModal
          amount={savingAmount}
          goal={savingGoal}
          goals={savingGoals}
          newGoalName={newGoalName}
          newGoalTarget={newGoalTarget}
          onClose={() => setActiveModal(null)}
          onSubmit={submitSaving}
          setAmount={setSavingAmount}
          setGoal={setSavingGoal}
          setNewGoalName={setNewGoalName}
          setNewGoalTarget={setNewGoalTarget}
        />
      )}

      {activeModal === "bill" && (
        <BillModal
          amount={billAmount}
          autopay={billAutopay}
          category={billCategory}
          due={billDue}
          frequency={billFrequency}
          kind={billKind}
          name={billName}
          onClose={() => setActiveModal(null)}
          onSubmit={submitBill}
          setAmount={setBillAmount}
          setAutopay={setBillAutopay}
          setCategory={setBillCategory}
          setDue={setBillDue}
          setFrequency={setBillFrequency}
          setKind={setBillKind}
          setName={setBillName}
        />
      )}

      {activeModal === "income" && (
        <IncomeModal
          amount={incomeAmount}
          date={incomeDate}
          frequency={incomeFrequency}
          incomeType={incomeType}
          onClose={() => setActiveModal(null)}
          onSubmit={submitIncome}
          setAmount={setIncomeAmount}
          setDate={setIncomeDate}
          setFrequency={setIncomeFrequency}
          setIncomeType={setIncomeType}
          setSource={setIncomeSource}
          source={incomeSource}
        />
      )}
    </main>
  );
}

function MonthNavigator({
  canGoNext,
  canGoPrevious,
  label,
  onNext,
  onPrevious,
}: {
  canGoNext: boolean;
  canGoPrevious: boolean;
  label: string;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <div className="month-nav" aria-label="Choose budget month">
      <button aria-label="Previous month" disabled={!canGoPrevious} onClick={onPrevious} type="button">←</button>
      <strong>{label}</strong>
      <button aria-label="Next month" disabled={!canGoNext} onClick={onNext} type="button">→</button>
    </div>
  );
}

function TodayView({
  goals,
  incomeEntries,
  month,
  onAddExpense,
  onAddIncome,
  onAddSaving,
  savingActions,
  setActiveView,
  spendVerdict,
  totals,
}: {
  goals: Goal[];
  incomeEntries: IncomeEntry[];
  month: MonthSnapshot;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onAddSaving: (goalName?: string) => void;
  savingActions: SavingAction[];
  setActiveView: (view: View) => void;
  spendVerdict: { label: string; tone: BudgetCategory["tone"]; copy: string };
  totals: {
    income: number;
    spentSoFar: number;
    savingsSetAside: number;
    billsStillComing: number;
    safeToSpend: number;
    dailyPace: number;
  };
}) {
  return (
    <>
      <section className="hero-panel">
        <div className="safe-card">
          <p className="eyebrow">Safe to spend for {month.monthLabel}</p>
          <strong>{money.format(totals.safeToSpend)}</strong>
          <span>
            {month.daysLeft > 0
              ? `Left after logged spending, savings, and upcoming bills. That is about ${money.format(totals.dailyPace)} per day for the next ${month.daysLeft} days.`
              : `This is what was left after ${month.monthName}'s logged spending, savings, and bills were covered.`}
          </span>
        </div>
        <div className="coach-card">
          <p className="eyebrow">Today check-in</p>
          <h3>{month.insight}</h3>
          <div className="hero-actions">
            <button className="ghost-button" onClick={onAddIncome} type="button">
              Add income
            </button>
            <button className="quiet-button" onClick={onAddExpense} type="button">
              Log spending
            </button>
            <button className="quiet-button" onClick={() => onAddSaving()} type="button">
              Log savings
            </button>
          </div>
        </div>
      </section>

      <section className="stats-grid" aria-label="Budget summary">
        <SummaryCard
          helper={`Pay, allowance, or other income expected for ${month.monthLabel}.`}
          label="Money in this month"
          value={money.format(totals.income)}
        />
        <SummaryCard
          helper={`Purchases and paid bills logged as of ${month.asOf}.`}
          label="Spent so far"
          value={money.format(totals.spentSoFar)}
        />
        <SummaryCard
          helper="Reserved for your goals, so it is not counted as spending money."
          label="Set aside for savings"
          value={money.format(totals.savingsSetAside)}
        />
        <SummaryCard
          helper={`Essential and optional bills still planned before ${month.monthName} ends.`}
          label="Bills still coming"
          value={money.format(totals.billsStillComing)}
        />
      </section>

      <section className="content-grid">
        <MoneyFlowPanel
          incomeEntries={incomeEntries}
          onAddExpense={onAddExpense}
          onAddIncome={onAddIncome}
          onAddSaving={onAddSaving}
          monthLabel={month.monthLabel}
          setActiveView={setActiveView}
          totals={totals}
        />
        <MoneyMath monthLabel={month.monthLabel} totals={totals} />
        <SavingsSnapshot goals={goals} onAddSaving={onAddSaving} savingActions={savingActions} />

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Spend check</p>
              <h3>{spendVerdict.label}</h3>
            </div>
            <span className={`pill ${spendVerdict.tone}`}>Live POC</span>
          </div>
          <p className="muted-copy">{spendVerdict.copy}</p>
        </article>

        <QuestPanel />
        <CategoryPanel categories={month.categories} monthName={month.monthName} />
      </section>
    </>
  );
}

function SpendView({
  bills,
  expenseFilter,
  monthId,
  monthLabel,
  onAddBill,
  onAddExpense,
  onSetBillStatus,
  quickEntry,
  selectedMood,
  setExpenseFilter,
  setQuickEntry,
  setSelectedMood,
  setSpendAmount,
  setSpendCheck,
  spendAmount,
  spendCheck,
  spendVerdict,
  visibleExpenses,
}: {
  bills: Bill[];
  expenseFilter: "All" | ExpenseType;
  monthId: MonthId;
  monthLabel: string;
  onAddBill: () => void;
  onAddExpense: () => void;
  onSetBillStatus: (billId: string, status: BillMonthStatus) => void;
  quickEntry: string;
  selectedMood: Mood;
  setExpenseFilter: (filter: "All" | ExpenseType) => void;
  setQuickEntry: (entry: string) => void;
  setSelectedMood: (mood: Mood) => void;
  setSpendAmount: (amount: number) => void;
  setSpendCheck: (name: string) => void;
  spendAmount: number;
  spendCheck: string;
  spendVerdict: { label: string; tone: BudgetCategory["tone"]; copy: string };
  visibleExpenses: Expense[];
}) {
  const total = visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const oopsTotal = visibleExpenses
    .filter((expense) => expense.mood === "Oops")
    .reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <section className="content-grid">
      <article className="panel quick-add wide">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Fast entry</p>
            <h3>Type it like a text.</h3>
          </div>
          <span className="pill blue">AI assist</span>
        </div>
        <label htmlFor="quick-entry">Natural language expense</label>
        <div className="entry-row">
          <input id="quick-entry" onChange={(event) => setQuickEntry(event.target.value)} value={quickEntry} />
          <button onClick={() => setQuickEntry("Added: Bubble tea, Food, $6.50, Today")} type="button">
            Parse
          </button>
        </div>
        <div className="parse-preview">
          <span>Detected</span>
          <b>Amount $6.50</b>
          <b>Category Food</b>
          <b>Date today</b>
          <b>Type Daily</b>
        </div>
      </article>

      <BillsPanel bills={bills} monthId={monthId} monthLabel={monthLabel} onAddBill={onAddBill} onSetBillStatus={onSetBillStatus} />

      <article className="panel wide purchase-checker">
        <div>
          <p className="eyebrow">Before you buy</p>
          <h3>Can I afford this?</h3>
          <p>Check a purchase against what is safe to spend after bills and savings.</p>
        </div>
        <div className="checker-form">
          <label htmlFor="spend-name">Purchase</label>
          <input id="spend-name" onChange={(event) => setSpendCheck(event.target.value)} value={spendCheck} />
          <label htmlFor="spend-amount">Amount</label>
          <input id="spend-amount" min="0" onChange={(event) => setSpendAmount(Number(event.target.value))} type="number" value={spendAmount} />
        </div>
        <div className={`verdict-card ${spendVerdict.tone}`}>
          <span>{monthLabel} answer</span>
          <strong>{spendVerdict.label}</strong>
          <p>{spendVerdict.copy}</p>
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Filters</p>
            <h3>{monthLabel} spending list.</h3>
          </div>
        </div>
        <div className="filter-row">
          {(["All", "Daily", "Fixed"] as const).map((filter) => (
            <button
              className={expenseFilter === filter ? "selected" : ""}
              key={filter}
              onClick={() => setExpenseFilter(filter)}
              type="button"
            >
              {filter === "Daily" ? "Everyday" : filter === "Fixed" ? "Paid bills" : filter}
            </button>
          ))}
        </div>
        <div className="mini-total">
          <span>Showing</span>
          <strong>{money.format(total)}</strong>
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Spending mood</p>
            <h3>Track vibes, not guilt.</h3>
          </div>
        </div>
        <div className="mood-row">
          {(["Worth it", "Needed", "Oops"] as Mood[]).map((mood) => (
            <button
              className={selectedMood === mood ? "selected" : ""}
              key={mood}
              onClick={() => setSelectedMood(mood)}
              type="button"
            >
              {mood}
            </button>
          ))}
        </div>
        <p className="muted-copy">
          This helps the AI explain patterns without sounding judgmental. Oops spending shown: {money.format(oopsTotal)}.
        </p>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Receipt scan POC</p>
            <h3>Snap, check, save.</h3>
          </div>
          <span className="pill warm">Prototype</span>
        </div>
        <div className="receipt-box">
          <span>Upload receipt</span>
          <p>AI would extract store, total, item groups, tax, date, and category.</p>
        </div>
      </article>

      <ExpenseList expenses={visibleExpenses} onAddExpense={onAddExpense} />
    </section>
  );
}

function SaveView({
  goals,
  monthId,
  onAddSaving,
  savingActions,
  totals,
}: {
  goals: Goal[];
  monthId: MonthId;
  onAddSaving: (goalName?: string) => void;
  savingActions: SavingAction[];
  totals: { safeToSpend: number };
}) {
  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const leftoverBoost = Math.max(0, Math.round(totals.safeToSpend * 0.15));
  const visibleSavingActions = savingActions.filter((action) => action.monthId === monthId);

  return (
    <section className="content-grid">
      <article className="panel wide savings-hero">
        <div>
          <p className="eyebrow">Savings home</p>
          <h3>{money.format(totalSaved)} saved across your goals.</h3>
          <p>You are {Math.round((totalSaved / totalTarget) * 100)}% of the way there. Tiny transfers count.</p>
        </div>
        <ProgressBar value={(totalSaved / totalTarget) * 100} tone="blue" />
        <button className="ghost-button savings-action" onClick={() => onAddSaving()} type="button">
          Add saving action
        </button>
      </article>

      <article className="panel wide">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Goal cards</p>
            <h3>Make goals feel close.</h3>
          </div>
          <span className="pill blue">Visual goals</span>
        </div>
        <div className="goal-grid">
          {goals.map((goal) => {
            const percent = (goal.saved / goal.target) * 100;
            return (
              <div className="goal-card" key={goal.name}>
                <div>
                  <strong>{goal.name}</strong>
                  <span>{goal.deadline}</span>
                </div>
                <ProgressBar value={percent} tone="blue" />
                <p>{money.format(goal.saved)} saved of {money.format(goal.target)}</p>
                <p>
                  Save {money.format(goal.monthly)}/month to stay on pace.
                </p>
                <p>{goal.boost}</p>
                <button className="quiet-button" onClick={() => onAddSaving(goal.name)} type="button">
                  Add to this goal
                </button>
              </div>
            );
          })}
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Round-ups</p>
            <h3>Save without thinking.</h3>
          </div>
        </div>
        <p className="muted-copy">Round purchases to the nearest dollar. This month could create about $34 in extra savings.</p>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Leftover split</p>
            <h3>{money.format(leftoverBoost)} could be moved.</h3>
          </div>
        </div>
        <div className="split-list">
          <span>50% Emergency fund</span>
          <span>30% Japan trip</span>
          <span>20% Laptop</span>
        </div>
      </article>

      <article className="panel wide">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Recent saving actions</p>
            <h3>Every contribution has a home.</h3>
          </div>
          <button className="quiet-button" onClick={() => onAddSaving()} type="button">Add savings</button>
        </div>
        {visibleSavingActions.length > 0 ? (
          <div className="saving-activity">
            {visibleSavingActions.map((action, index) => (
              <div className="saving-row" key={`${action.goal}-${index}`}>
                <div>
                  <strong>{action.goal}</strong>
                  <span>{action.date}</span>
                </div>
                <b>+{exactMoney.format(action.amount)}</b>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">Your first logged saving action will appear here.</p>
        )}
      </article>
    </section>
  );
}

function IncomeView({
  incomeEntries,
  monthId,
  monthLabel,
  onAddIncome,
  totals,
}: {
  incomeEntries: IncomeEntry[];
  monthId: MonthId;
  monthLabel: string;
  onAddIncome: () => void;
  totals: { income: number };
}) {
  const visibleIncome = incomeEntries.filter((entry) => entry.monthId === monthId);
  const trackedTotal = visibleIncome.reduce((sum, entry) => sum + entry.amount, 0);
  const calendarItems: Record<MonthId, string[]> = {
    "2025-07": ["Jul 11: campus job pay", "Jul 25: campus job pay", "Jul 31: month closed", "One-offs: log when received"],
    "2025-08": ["Aug 11: campus job pay", "Aug 23: next paycheque", "Aug 29: expected pay", "One-offs: log when received"],
    "2025-09": ["Sep 5: campus job pay", "Sep 19: next paycheque", "Sep 30: month check-in", "One-offs: log when received"],
  };

  return (
    <section className="content-grid">
      <article className="panel wide income-hero">
        <div>
          <p className="eyebrow">Income home</p>
          <h3>{money.format(totals.income)} expected in {monthLabel}.</h3>
          <p>Track steady pay and surprise money without treating every deposit the same.</p>
        </div>
        <button className="ghost-button" onClick={onAddIncome} type="button">Add income</button>
      </article>

      <SummaryCard helper="Your budget's expected income, including newly logged deposits." label="Expected money in" value={money.format(totals.income)} />
      <SummaryCard helper="Income records visible in the current filter." label="Tracked sources" value={money.format(trackedTotal)} />
      <SummaryCard helper="Your next regular campus-job deposit." label="Next paycheque" value="$800 Friday" />
      <SummaryCard helper="A regular source that makes planning easier." label="Most predictable" value="Campus job" />

      <article className="panel wide">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Income activity</p>
            <h3>Regular pay and one-off money, separated.</h3>
          </div>
          <button className="ghost-button" onClick={onAddIncome} type="button">Add income</button>
        </div>
        <div className="income-list">
          {visibleIncome.map((entry, index) => (
            <div className="income-row" key={`${entry.source}-${index}`}>
              <div>
                <strong>{entry.source}</strong>
                <span>{entry.type} / {entry.date}</span>
              </div>
              <span className="income-frequency">{entry.frequency}</span>
              <b>+{exactMoney.format(entry.amount)}</b>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Payday planner</p>
            <h3>Give regular pay a job.</h3>
          </div>
        </div>
        <div className="split-list">
          <span>55% needs</span>
          <span>25% fun</span>
          <span>15% savings</span>
          <span>5% buffer</span>
        </div>
      </article>

      <article className="panel wide">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Income calendar</p>
            <h3>Know when money is coming.</h3>
          </div>
        </div>
        <div className="calendar-strip">
          {calendarItems[monthId].map((item) => <span key={item}>{item}</span>)}
        </div>
      </article>
    </section>
  );
}

function CoachView({
  monthLabel,
  spendCheck,
  spendVerdict,
  totals,
}: {
  monthLabel: string;
  spendCheck: string;
  spendVerdict: { label: string; copy: string };
  totals: {
    income: number;
    safeToSpend: number;
    spentSoFar: number;
    savingsSetAside: number;
    billsStillComing: number;
  };
}) {
  return (
    <section className="content-grid">
      <article className="panel wide coach-page">
        <p className="eyebrow">AI coach POC</p>
        <h3>{spendCheck ? `About the ${spendCheck}: ${spendVerdict.label}` : "Ask anything in plain English."}</h3>
        <p>{spendVerdict.copy}</p>
      </article>

      <SummaryCard helper="Available after the rest of your plan is covered." label="Safe to spend" value={money.format(totals.safeToSpend)} />
      <SummaryCard helper={`Paycheques and one-off deposits included in ${monthLabel}.`} label="Money in" value={money.format(totals.income)} />
      <SummaryCard helper="Purchases and paid bills already logged." label="Spent so far" value={money.format(totals.spentSoFar)} />
      <SummaryCard helper="Goal money kept out of your spending balance." label="Set aside for savings" value={money.format(totals.savingsSetAside)} />
      <SummaryCard helper={`Essential and optional bills still planned for ${monthLabel}.`} label="Bills still coming" value={money.format(totals.billsStillComing)} />

      <article className="panel">
        <p className="eyebrow">Starter questions</p>
        <div className="prompt-list">
          <button type="button">Can I afford this?</button>
          <button type="button">Which income can I count on?</button>
          <button type="button">What changed this month?</button>
          <button type="button">Give me one easy fix</button>
          <button type="button">Explain my spending like I am busy</button>
        </div>
      </article>

      <article className="panel wide">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">No-shame mode</p>
            <h3>Friendly feedback style.</h3>
          </div>
        </div>
        <p className="muted-copy">
          Instead of saying “you overspent,” the coach says “shopping is using up your cushion. Want to protect the rest of the month?”
        </p>
      </article>
    </section>
  );
}

function CategoryPanel({ categories, monthName }: { categories: BudgetCategory[]; monthName: string }) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Category health</p>
          <h3>{monthName} budget limits.</h3>
        </div>
      </div>
      <div className="category-list">
        {categories.map((category) => {
          const percent = (category.spent / category.limit) * 100;
          return (
            <div className="category-item" key={category.name}>
              <div>
                <strong>{category.name}</strong>
                <span>
                  {money.format(category.spent)} of {money.format(category.limit)}
                </span>
              </div>
              <ProgressBar value={percent} tone={category.tone} />
            </div>
          );
        })}
      </div>
    </article>
  );
}

function QuestPanel() {
  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Money quests</p>
          <h3>Small wins, not chores.</h3>
        </div>
      </div>
      <div className="quest-list">
        {quests.map((quest) => (
          <div className="quest-row" key={quest.name}>
            <div>
              <strong>{quest.name}</strong>
              <span>{quest.reward}</span>
            </div>
            <b>{quest.status}</b>
          </div>
        ))}
      </div>
    </article>
  );
}

function BillsPanel({
  bills,
  monthId,
  monthLabel,
  onAddBill,
  onSetBillStatus,
}: {
  bills: Bill[];
  monthId: MonthId;
  monthLabel: string;
  onAddBill: () => void;
  onSetBillStatus: (billId: string, status: BillMonthStatus) => void;
}) {
  const essentialBills = bills.filter((bill) => bill.kind === "Essential");
  const optionalBills = bills.filter((bill) => bill.kind === "Optional");
  const optionalUpcoming = optionalBills
    .filter((bill) => (bill.statuses[monthId] ?? "Upcoming") === "Upcoming")
    .reduce((sum, bill) => sum + bill.amount, 0);
  const optionalPaid = optionalBills
    .filter((bill) => bill.statuses[monthId] === "Paid")
    .reduce((sum, bill) => sum + bill.amount, 0);
  const optionalSkipped = optionalBills
    .filter((bill) => bill.statuses[monthId] === "Skipped")
    .reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <article className="panel wide bills-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Recurring bills</p>
          <h3>Plan the must-pays and choose the nice-to-haves.</h3>
        </div>
        <button className="ghost-button" onClick={onAddBill} type="button">Add bill</button>
      </div>
      <p className="bill-explainer">Each bill remembers its schedule. Optional bills can be paid or skipped for {monthLabel} without changing future months.</p>

      <div className="bill-section-heading">
        <div>
          <span>Essential bills</span>
          <strong>Regular costs you plan around</strong>
        </div>
      </div>
      <div className="bill-list">
        {essentialBills.map((bill) => {
          const status = bill.statuses[monthId] ?? "Upcoming";
          return (
          <div className="bill-row" key={bill.id}>
            <div>
              <strong>{bill.name}</strong>
              <span>{bill.category} / due {bill.due}</span>
            </div>
            <b>{exactMoney.format(bill.amount)}</b>
            <span className="bill-frequency">{bill.frequency}</span>
            <span className={`bill-status ${status.toLowerCase()}`}>{status === "Upcoming" && bill.autopay ? "Autopay soon" : status}</span>
          </div>
          );
        })}
      </div>

      <div className="optional-heading">
        <div>
          <p className="eyebrow">Optional this month</p>
          <h3>Keep it, enjoy it, or skip it. No guilt.</h3>
        </div>
        <div className="optional-summary" aria-label="Optional bill summary">
          <span><b>{money.format(optionalUpcoming)}</b> planned</span>
          <span><b>{money.format(optionalPaid)}</b> paid</span>
          <span><b>{money.format(optionalSkipped)}</b> skipped</span>
        </div>
      </div>

      <div className="optional-bill-list">
        {optionalBills.map((bill) => {
          const status = bill.statuses[monthId] ?? "Upcoming";
          return (
            <div className="optional-bill-row" key={bill.id}>
              <div className="optional-bill-copy">
                <span className="optional-icon" aria-hidden="true">{bill.category === "Wellness" ? "✦" : bill.category === "Personal care" ? "♥" : "●"}</span>
                <div>
                  <strong>{bill.name}</strong>
                  <span>{bill.category} / {bill.frequency.toLowerCase()} / {exactMoney.format(bill.amount)}</span>
                </div>
              </div>
              <span className={`bill-status ${status.toLowerCase()}`}>{status === "Skipped" ? "Skipped this month" : status}</span>
              <div className="bill-actions">
                {status === "Upcoming" ? (
                  <>
                    <button className="bill-action paid" onClick={() => onSetBillStatus(bill.id, "Paid")} type="button">Paid</button>
                    <button className="bill-action skip" onClick={() => onSetBillStatus(bill.id, "Skipped")} type="button">Skip this month</button>
                  </>
                ) : (
                  <button className="bill-action reset" onClick={() => onSetBillStatus(bill.id, "Upcoming")} type="button">Undo</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function ExpenseList({
  expenses,
  onAddExpense,
}: {
  expenses: Expense[];
  onAddExpense: () => void;
}) {
  return (
    <article className="panel wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Recent activity</p>
          <h3>Everyday purchases and paid bills.</h3>
        </div>
        <button className="ghost-button" onClick={onAddExpense} type="button">Add expense</button>
      </div>
      <div className="expense-list">
        {expenses.map((expense, index) => (
          <div className="expense-row" key={`${expense.merchant}-${index}`}>
            <div>
              <strong>{expense.merchant}</strong>
              <span>
                {expense.category} / {expense.date}
              </span>
            </div>
            <span className={`mood-pill ${moodClass(expense.mood)}`}>{expense.mood}</span>
            <span className={`type-pill ${expense.type.toLowerCase()}`}>{expense.type}</span>
            <b>{exactMoney.format(expense.amount)}</b>
          </div>
        ))}
      </div>
    </article>
  );
}

function MoneyFlowPanel({
  incomeEntries,
  monthLabel,
  onAddExpense,
  onAddIncome,
  onAddSaving,
  setActiveView,
  totals,
}: {
  incomeEntries: IncomeEntry[];
  monthLabel: string;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onAddSaving: (goalName?: string) => void;
  setActiveView: (view: View) => void;
  totals: {
    income: number;
    spentSoFar: number;
    savingsSetAside: number;
    billsStillComing: number;
  };
}) {
  const recentIncome = incomeEntries[0];

  return (
    <article className="panel wide money-flow-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Your money flow</p>
          <h3>What came in, what went out, and what you protected.</h3>
        </div>
        <span className="pill blue">{monthLabel}</span>
      </div>
      <div className="money-flow-grid">
        <button className="flow-item income" onClick={onAddIncome} type="button">
          <span>Income</span>
          <strong>{money.format(totals.income)}</strong>
          <small>{recentIncome ? `Latest source: ${recentIncome.source}` : "Add money received"}</small>
          <b>Add income</b>
        </button>
        <button className="flow-item spending" onClick={onAddExpense} type="button">
          <span>Spent so far</span>
          <strong>{money.format(totals.spentSoFar)}</strong>
          <small>Purchases and paid bills</small>
          <b>Add expense</b>
        </button>
        <button className="flow-item saving" onClick={() => onAddSaving()} type="button">
          <span>Savings</span>
          <strong>{money.format(totals.savingsSetAside)}</strong>
          <small>Reserved for your goals</small>
          <b>Add savings</b>
        </button>
        <button className="flow-item bills" onClick={() => setActiveView("Spend")} type="button">
          <span>Bills still coming</span>
          <strong>{money.format(totals.billsStillComing)}</strong>
          <small>Recurring costs not paid yet</small>
          <b>Manage bills</b>
        </button>
      </div>
    </article>
  );
}

function BillModal({
  amount,
  autopay,
  category,
  due,
  frequency,
  kind,
  name,
  onClose,
  onSubmit,
  setAmount,
  setAutopay,
  setCategory,
  setDue,
  setFrequency,
  setKind,
  setName,
}: {
  amount: string;
  autopay: boolean;
  category: string;
  due: string;
  frequency: BillFrequency;
  kind: BillKind;
  name: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setAmount: (value: string) => void;
  setAutopay: (value: boolean) => void;
  setCategory: (value: string) => void;
  setDue: (value: string) => void;
  setFrequency: (value: BillFrequency) => void;
  setKind: (value: BillKind) => void;
  setName: (value: string) => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="bill-modal-title" aria-modal="true" className="modal-card" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Recurring spending</p>
            <h2 id="bill-modal-title">Add a bill</h2>
            <p>Unlike a one-time expense, a bill remembers when it repeats.</p>
          </div>
          <button aria-label="Close bill form" className="modal-close" onClick={onClose} type="button">Close</button>
        </div>
        <form className="modal-form" onSubmit={onSubmit}>
          <fieldset className="bill-kind-picker">
            <legend>What kind of bill is this?</legend>
            {(["Essential", "Optional"] as BillKind[]).map((option) => (
              <label className={kind === option ? "selected" : ""} key={option}>
                <input checked={kind === option} name="bill-kind" onChange={() => setKind(option)} type="radio" />
                <span>
                  <strong>{option}</strong>
                  <small>{option === "Essential" ? "A must-pay cost like rent or phone" : "A flexible cost like nails, massage, or maintenance"}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <label htmlFor="bill-name">Bill name</label>
          <input autoFocus id="bill-name" onChange={(event) => setName(event.target.value)} placeholder="Phone, rent, gym..." required value={name} />
          <div className="modal-grid">
            <div>
              <label htmlFor="bill-amount">Usual amount</label>
              <input id="bill-amount" min="0.01" onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required step="0.01" type="number" value={amount} />
            </div>
            <div>
              <label htmlFor="bill-frequency">Repeats</label>
              <select id="bill-frequency" onChange={(event) => setFrequency(event.target.value as BillFrequency)} value={frequency}>
                <option>Weekly</option>
                <option>Biweekly</option>
                <option>Monthly</option>
                <option>Yearly</option>
              </select>
            </div>
            <div>
              <label htmlFor="bill-due">Next due</label>
              <input id="bill-due" onChange={(event) => setDue(event.target.value)} placeholder="18th or choose a date" required value={due} />
            </div>
            <div>
              <label htmlFor="bill-category">Category</label>
              <select id="bill-category" onChange={(event) => setCategory(event.target.value)} value={category}>
                {['Subscription', 'Housing', 'Phone', 'Utilities', 'Insurance', 'Debt', 'Wellness', 'Personal care', 'Maintenance', 'Other'].map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
          </div>
          <label className="checkbox-row" htmlFor="bill-autopay">
            <input checked={autopay} id="bill-autopay" onChange={(event) => setAutopay(event.target.checked)} type="checkbox" />
            <span>This bill is paid automatically</span>
          </label>
          <div className="saving-preview">
            <span>Budget effect</span>
            <strong>{kind === "Optional"
              ? `${money.format(Number(amount) || 0)} is planned, but you can skip it in any month.`
              : `${money.format(Number(amount) || 0)} will be reserved for this ${frequency.toLowerCase()} bill.`}</strong>
          </div>
          <div className="modal-actions">
            <button className="quiet-button" onClick={onClose} type="button">Cancel</button>
            <button className="ghost-button" type="submit">Add recurring bill</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function IncomeModal({
  amount,
  date,
  frequency,
  incomeType,
  onClose,
  onSubmit,
  setAmount,
  setDate,
  setFrequency,
  setIncomeType,
  setSource,
  source,
}: {
  amount: string;
  date: string;
  frequency: IncomeFrequency;
  incomeType: IncomeType;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setAmount: (value: string) => void;
  setDate: (value: string) => void;
  setFrequency: (value: IncomeFrequency) => void;
  setIncomeType: (value: IncomeType) => void;
  setSource: (value: string) => void;
  source: string;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="income-modal-title" aria-modal="true" className="modal-card" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Money received</p>
            <h2 id="income-modal-title">Add income</h2>
            <p>Log a regular paycheque or money that arrived unexpectedly.</p>
          </div>
          <button aria-label="Close income form" className="modal-close" onClick={onClose} type="button">Close</button>
        </div>
        <form className="modal-form" onSubmit={onSubmit}>
          <label htmlFor="income-source">Where did it come from?</label>
          <input autoFocus id="income-source" onChange={(event) => setSource(event.target.value)} placeholder="Campus job, tax credit, client..." required value={source} />
          <div className="modal-grid">
            <div>
              <label htmlFor="income-amount">Amount received</label>
              <input id="income-amount" min="0.01" onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required step="0.01" type="number" value={amount} />
            </div>
            <div>
              <label htmlFor="income-type">Income type</label>
              <select id="income-type" onChange={(event) => setIncomeType(event.target.value as IncomeType)} value={incomeType}>
                <option>Paycheque</option>
                <option>Government</option>
                <option>Side gig</option>
                <option>Gift</option>
                <option>Refund</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="income-frequency">How often?</label>
              <select id="income-frequency" onChange={(event) => setFrequency(event.target.value as IncomeFrequency)} value={frequency}>
                <option>One-time</option>
                <option>Weekly</option>
                <option>Biweekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div>
              <label htmlFor="income-date">Received</label>
              <input id="income-date" onChange={(event) => setDate(event.target.value)} placeholder="Today or Aug 15" required value={date} />
            </div>
          </div>
          <div className="saving-preview income-preview">
            <span>Money flow effect</span>
            <strong>{money.format(Number(amount) || 0)} will be added to money in.</strong>
          </div>
          <div className="modal-actions">
            <button className="quiet-button" onClick={onClose} type="button">Cancel</button>
            <button className="ghost-button" type="submit">Add income</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SavingsSnapshot({
  goals,
  onAddSaving,
  savingActions,
}: {
  goals: Goal[];
  onAddSaving: (goalName?: string) => void;
  savingActions: SavingAction[];
}) {
  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);

  return (
    <article className="panel savings-snapshot wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Savings progress</p>
          <h3>{money.format(totalSaved)} is working toward things you care about.</h3>
        </div>
        <button className="ghost-button" onClick={() => onAddSaving()} type="button">
          Add saving action
        </button>
      </div>
      <div className="goal-summary-list">
        {goals.slice(0, 4).map((goal) => (
          <button className="goal-summary-row" key={goal.name} onClick={() => onAddSaving(goal.name)} type="button">
            <span>
              <strong>{goal.name}</strong>
              <small>{money.format(goal.saved)} of {money.format(goal.target)}</small>
            </span>
            <span>{Math.round((goal.saved / goal.target) * 100)}%</span>
          </button>
        ))}
      </div>
      <p className="snapshot-note">
        {savingActions.length > 0
          ? `Latest: ${exactMoney.format(savingActions[0].amount)} added to ${savingActions[0].goal} today.`
          : "Tap a goal to log your first saving action."}
      </p>
    </article>
  );
}

function ExpenseModal({
  amount,
  category,
  mood,
  name,
  onClose,
  onSubmit,
  setAmount,
  setCategory,
  setMood,
  setName,
}: {
  amount: string;
  category: string;
  mood: Mood;
  name: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setAmount: (value: string) => void;
  setCategory: (value: string) => void;
  setMood: (value: Mood) => void;
  setName: (value: string) => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="expense-modal-title" aria-modal="true" className="modal-card" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Log spending</p>
            <h2 id="expense-modal-title">Add an expense</h2>
            <p>Just the useful details. You can edit them later.</p>
          </div>
          <button aria-label="Close expense form" className="modal-close" onClick={onClose} type="button">Close</button>
        </div>
        <form className="modal-form" onSubmit={onSubmit}>
          <label htmlFor="expense-name">What did you spend on?</label>
          <input
            autoFocus
            id="expense-name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Lunch, bus pass, phone bill..."
            required
            value={name}
          />
          <div className="modal-grid">
            <div>
              <label htmlFor="expense-amount">Amount</label>
              <input
                id="expense-amount"
                min="0.01"
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                required
                step="0.01"
                type="number"
                value={amount}
              />
            </div>
            <div>
              <label htmlFor="expense-category">Category</label>
              <select id="expense-category" onChange={(event) => setCategory(event.target.value)} value={category}>
                {['Food', 'Transit', 'Shopping', 'Fun', 'Bills', 'Housing', 'Other'].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="expense-mood">How did it feel?</label>
              <select id="expense-mood" onChange={(event) => setMood(event.target.value as Mood)} value={mood}>
                <option>Needed</option>
                <option>Worth it</option>
                <option>Oops</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button className="quiet-button" onClick={onClose} type="button">Cancel</button>
            <button className="ghost-button" type="submit">Add expense</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SavingModal({
  amount,
  goal,
  goals,
  newGoalName,
  newGoalTarget,
  onClose,
  onSubmit,
  setAmount,
  setGoal,
  setNewGoalName,
  setNewGoalTarget,
}: {
  amount: string;
  goal: string;
  goals: Goal[];
  newGoalName: string;
  newGoalTarget: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setAmount: (value: string) => void;
  setGoal: (value: string) => void;
  setNewGoalName: (value: string) => void;
  setNewGoalTarget: (value: string) => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="saving-modal-title" aria-modal="true" className="modal-card" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Log savings</p>
            <h2 id="saving-modal-title">Add a saving action</h2>
            <p>Choose how much you saved and where you want it to go.</p>
          </div>
          <button aria-label="Close saving form" className="modal-close" onClick={onClose} type="button">Close</button>
        </div>
        <form className="modal-form" onSubmit={onSubmit}>
          <label htmlFor="saving-amount">How much did you save?</label>
          <input
            autoFocus
            id="saving-amount"
            min="0.01"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            required
            step="0.01"
            type="number"
            value={amount}
          />
          <label htmlFor="saving-goal">Where should it go?</label>
          <select id="saving-goal" onChange={(event) => setGoal(event.target.value)} value={goal}>
            {goals.map((item) => (
              <option key={item.name} value={item.name}>{item.name}</option>
            ))}
            <option value="__new">Create a new saving goal</option>
          </select>
          {goal === "__new" && (
            <div className="new-goal-fields">
              <div>
                <label htmlFor="new-goal-name">New goal name</label>
                <input
                  id="new-goal-name"
                  onChange={(event) => setNewGoalName(event.target.value)}
                  placeholder="Festival trip, first car..."
                  required
                  value={newGoalName}
                />
              </div>
              <div>
                <label htmlFor="new-goal-target">Goal amount</label>
                <input
                  id="new-goal-target"
                  min="1"
                  onChange={(event) => setNewGoalTarget(event.target.value)}
                  required
                  type="number"
                  value={newGoalTarget}
                />
              </div>
            </div>
          )}
          <div className="saving-preview">
            <span>After this action</span>
            <strong>
              {goal === "__new"
                ? `${newGoalName || "Your new goal"} starts with ${money.format(Number(amount) || 0)}`
                : `${goal} gets ${money.format(Number(amount) || 0)} closer`}
            </strong>
          </div>
          <div className="modal-actions">
            <button className="quiet-button" onClick={onClose} type="button">Cancel</button>
            <button className="ghost-button" type="submit">Add to savings</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function MoneyMath({
  monthLabel,
  totals,
}: {
  monthLabel: string;
  totals: {
    income: number;
    spentSoFar: number;
    savingsSetAside: number;
    billsStillComing: number;
    safeToSpend: number;
  };
}) {
  const rows = [
    { label: "Money in", value: totals.income, operator: "" },
    { label: "Spent so far", value: totals.spentSoFar, operator: "-" },
    { label: "Set aside for savings", value: totals.savingsSetAside, operator: "-" },
    { label: "Bills still coming", value: totals.billsStillComing, operator: "-" },
  ];

  return (
    <article className="panel money-math wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">How we got this number</p>
          <h3>Your {monthLabel} money, step by step.</h3>
        </div>
        <span className="pill">Nothing counted twice</span>
      </div>
      <div className="math-rows">
        {rows.map((row) => (
          <div className="math-row" key={row.label}>
            <span className="math-operator" aria-hidden="true">{row.operator}</span>
            <span>{row.label}</span>
            <strong>{money.format(row.value)}</strong>
          </div>
        ))}
        <div className="math-row math-total">
          <span className="math-operator" aria-hidden="true">=</span>
          <span>Safe to spend</span>
          <strong>{money.format(totals.safeToSpend)}</strong>
        </div>
      </div>
      <p className="math-note">Paid bills belong in “spent so far.” Only unpaid bills appear in “bills still coming.”</p>
    </article>
  );
}

function SummaryCard({
  helper,
  label,
  value,
}: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <article className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function getSpendVerdict(amount: number, safeToSpend: number) {
  if (amount <= safeToSpend * 0.25) {
    return {
      label: "Looks comfortable",
      tone: "green" as const,
      copy: "This fits your monthly budget and still leaves breathing room.",
    };
  }

  if (amount <= safeToSpend * 0.55) {
    return {
      label: "Possible, but choose carefully",
      tone: "warm" as const,
      copy: "You can do it, but it uses a noticeable chunk of your cushion. Pick one trade-off first.",
    };
  }

  return {
    label: "Wait or make a swap",
    tone: "red" as const,
    copy: "Buying this now would make the rest of the month tight. Try delaying it or moving money from fun spending.",
  };
}

function getViewTitle(view: View, monthLabel: string) {
  const titles = {
    Today: `${monthLabel} money snapshot.`,
    Spend: "Expenses and bills, together.",
    Save: "Make goals feel doable.",
    Income: "Track every kind of money in.",
    Coach: "Plain-English money help.",
  };

  return titles[view];
}

function navHint(view: View) {
  const hints = {
    Today: "home",
    Spend: "expenses + bills",
    Save: "goals",
    Income: "pay + deposits",
    Coach: "AI",
  };

  return hints[view];
}

function moodClass(mood: Mood) {
  if (mood === "Worth it") return "good";
  if (mood === "Needed") return "need";
  return "oops";
}
