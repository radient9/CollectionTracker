const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const db = require('../db/database');
const { authenticateAdmin } = require('../middleware/auth');

function formatDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatINR(amount) {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// GET /api/export/excel
router.get('/excel', authenticateAdmin, async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CollectionTracker';
  workbook.created = new Date();

  const members = db.prepare(
    "SELECT * FROM members WHERE is_active = 1 ORDER BY name ASC"
  ).all();
  const allCollections = db.prepare(
    "SELECT c.*, m.name as member_name FROM collections c JOIN members m ON c.member_id = m.id ORDER BY year ASC, month ASC"
  ).all();
  const expenses = db.prepare("SELECT * FROM expenses ORDER BY date ASC").all();

  // Sheet 1: Members
  const membersSheet = workbook.addWorksheet('Members');
  membersSheet.columns = [
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Joined Date', key: 'joined_date', width: 15 },
    { header: 'Prior Contributions', key: 'opening_balance', width: 20 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Role', key: 'role', width: 10 },
  ];
  membersSheet.getRow(1).font = { bold: true };
  members.forEach(m => {
    membersSheet.addRow({
      name: m.name,
      phone: m.phone || '',
      joined_date: m.joined_date || '',
      opening_balance: m.opening_balance || 0,
      status: m.is_active ? 'Active' : 'Inactive',
      role: m.is_admin ? 'Admin' : 'Member',
    });
  });

  // Sheet 2: Monthly Collections (pivot)
  const collectionsSheet = workbook.addWorksheet('Monthly Collections');

  // Get all unique year-month combos sorted chronologically
  const monthCombos = db.prepare(
    "SELECT DISTINCT year, month FROM collections ORDER BY year ASC, month ASC"
  ).all();

  const headerRow = ['Member Name', ...monthCombos.map(c => `${MONTH_NAMES[c.month - 1]}-${c.year}`), 'Total'];
  collectionsSheet.addRow(headerRow);
  collectionsSheet.getRow(1).font = { bold: true };
  collectionsSheet.getColumn(1).width = 25;
  collectionsSheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];

  members.forEach(member => {
    const rowData = [member.name];
    let total = member.opening_balance || 0;
    monthCombos.forEach(({ year, month }) => {
      const col = allCollections.find(c => c.member_id === member.id && c.year === year && c.month === month);
      const amt = col ? col.amount_paid : null;
      rowData.push(amt !== null ? amt : '');
      if (amt !== null) total += amt;
    });
    rowData.push(total);
    collectionsSheet.addRow(rowData);
  });

  // Sheet 3: Expenses
  const expensesSheet = workbook.addWorksheet('Expenses');
  expensesSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Description', key: 'description', width: 35 },
    { header: 'Spent By', key: 'spent_by', width: 20 },
    { header: 'Amount', key: 'amount', width: 15 },
  ];
  expensesSheet.getRow(1).font = { bold: true };
  let expenseTotal = 0;
  expenses.forEach(e => {
    expensesSheet.addRow({ date: e.date, description: e.description, spent_by: e.spent_by || '', amount: e.amount });
    expenseTotal += e.amount;
  });
  const totalRow = expensesSheet.addRow(['', '', 'Total', expenseTotal]);
  totalRow.font = { bold: true };

  const filename = `collection-tracker-${formatDate()}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
});

// GET /api/export/pdf
router.get('/pdf', authenticateAdmin, (req, res) => {
  const members = db.prepare(
    "SELECT * FROM members WHERE is_active = 1 ORDER BY name ASC"
  ).all();
  const allCollections = db.prepare(
    "SELECT c.*, m.name as member_name FROM collections c JOIN members m ON c.member_id = m.id ORDER BY year ASC, month ASC"
  ).all();
  const expenses = db.prepare("SELECT * FROM expenses ORDER BY date ASC").all();

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  const filename = `collection-tracker-${formatDate()}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  // Page 1: Cover
  doc.fontSize(24).font('Helvetica-Bold').text('Biruver Kanthavara Billava Sangha', { align: 'center' });
  doc.moveDown();
  doc.fontSize(18).font('Helvetica').text('Financial Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

  // Page 2: Members
  doc.addPage();
  doc.fontSize(16).font('Helvetica-Bold').text('Members', { underline: true });
  doc.moveDown(0.5);

  const memberTableTop = doc.y;
  const memberCols = [30, 180, 310, 420, 500];
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Name', memberCols[0], memberTableTop);
  doc.text('Phone', memberCols[1], memberTableTop);
  doc.text('Joined', memberCols[2], memberTableTop);
  doc.text('Prior Contrib.', memberCols[3], memberTableTop);
  doc.text('Role', memberCols[4], memberTableTop);
  doc.moveDown(0.3);
  doc.moveTo(30, doc.y).lineTo(570, doc.y).stroke();
  doc.moveDown(0.3);

  doc.font('Helvetica').fontSize(9);
  members.forEach(m => {
    if (doc.y > 700) { doc.addPage(); }
    const y = doc.y;
    doc.text(m.name, memberCols[0], y, { width: 140 });
    doc.text(m.phone || '', memberCols[1], y, { width: 120 });
    doc.text(m.joined_date || '', memberCols[2], y, { width: 100 });
    doc.text(formatINR(m.opening_balance || 0), memberCols[3], y, { width: 70 });
    doc.text(m.is_admin ? 'Admin' : 'Member', memberCols[4], y, { width: 60 });
    doc.moveDown(0.5);
  });

  // Page 3: Collections Summary (year-wise totals per member)
  doc.addPage();
  doc.fontSize(16).font('Helvetica-Bold').text('Collections Summary', { underline: true });
  doc.moveDown(0.5);

  const years = [...new Set(allCollections.map(c => c.year))].sort();
  doc.font('Helvetica-Bold').fontSize(10);
  const collColStart = [30, 200];
  years.forEach(year => {
    collColStart.push(collColStart[collColStart.length - 1] + 80);
  });

  // Header
  const collHeaderY = doc.y;
  doc.text('Member', 30, collHeaderY, { width: 160 });
  doc.text('Prior Contrib.', 200, collHeaderY, { width: 90 });
  years.forEach((year, i) => {
    doc.text(String(year), 300 + i * 80, collHeaderY, { width: 70 });
  });
  doc.moveDown(0.3);
  doc.moveTo(30, doc.y).lineTo(570, doc.y).stroke();
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(9);

  members.forEach(m => {
    if (doc.y > 700) { doc.addPage(); }
    const y = doc.y;
    doc.text(m.name, 30, y, { width: 160 });
    doc.text(formatINR(m.opening_balance || 0), 200, y, { width: 90 });
    years.forEach((year, i) => {
      const yearTotal = allCollections
        .filter(c => c.member_id === m.id && c.year === year)
        .reduce((s, c) => s + (c.amount_paid || 0), 0);
      doc.text(yearTotal > 0 ? formatINR(yearTotal) : '-', 300 + i * 80, y, { width: 70 });
    });
    doc.moveDown(0.5);
  });

  // Page 4: Expenses
  doc.addPage();
  doc.fontSize(16).font('Helvetica-Bold').text('Expenses', { underline: true });
  doc.moveDown(0.5);

  const expCols = [30, 130, 350, 460];
  doc.font('Helvetica-Bold').fontSize(10);
  const expHeaderY = doc.y;
  doc.text('Date', expCols[0], expHeaderY);
  doc.text('Description', expCols[1], expHeaderY);
  doc.text('Spent By', expCols[2], expHeaderY);
  doc.text('Amount', expCols[3], expHeaderY);
  doc.moveDown(0.3);
  doc.moveTo(30, doc.y).lineTo(570, doc.y).stroke();
  doc.moveDown(0.3);

  doc.font('Helvetica').fontSize(9);
  let runningTotal = 0;
  expenses.forEach(e => {
    if (doc.y > 700) { doc.addPage(); }
    const y = doc.y;
    runningTotal += e.amount;
    doc.text(e.date || '', expCols[0], y, { width: 90 });
    doc.text(e.description, expCols[1], y, { width: 210 });
    doc.text(e.spent_by || '', expCols[2], y, { width: 100 });
    doc.text(formatINR(e.amount), expCols[3], y, { width: 100 });
    doc.moveDown(0.5);
  });
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(`Total Expenses: ${formatINR(runningTotal)}`, { align: 'right' });

  // Last Page: Balance Summary
  doc.addPage();
  doc.fontSize(16).font('Helvetica-Bold').text('Balance Summary', { underline: true });
  doc.moveDown();

  const totalPrior = members.reduce((s, m) => s + (m.opening_balance || 0), 0);
  const totalCollected = allCollections.reduce((s, c) => s + (c.amount_paid || 0), 0);
  const totalExpensesAmt = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netBalance = totalPrior + totalCollected - totalExpensesAmt;

  const summaryItems = [
    ['Total Prior Contributions', formatINR(totalPrior)],
    ['Total Monthly Collected', formatINR(totalCollected)],
    ['Total Expenses', formatINR(totalExpensesAmt)],
    ['Net Balance', formatINR(netBalance)],
  ];

  doc.font('Helvetica').fontSize(12);
  summaryItems.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(label + ': ', { continued: true });
    doc.font('Helvetica').text(value);
    doc.moveDown(0.5);
  });

  doc.end();
});

module.exports = router;
