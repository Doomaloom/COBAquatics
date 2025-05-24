const Excel = require('exceljs');
const { parse } = require('csv-parse/sync');

function addTimeHeaders(ws) {
  let prev = null;
  for (let i = 2; i <= ws.rowCount; i++) {
    const t = ws.getRow(i).getCell(2).value;
    if (t !== prev) {
      ws.spliceRows(i, 0, [ t, '', '', '', '', '', '' ]);
      prev = t;
      i++;
    }
  }
}

function addCourseHeaders(ws) {
  let prev = null;
  for (let i = 2; i <= ws.rowCount; i++) {
    const course = ws.getRow(i).getCell(1).value;
    const name   = ws.getRow(i).getCell(4).value;
    if (course !== prev && ws.getRow(i).getCell(2).value) {
      ws.spliceRows(i, 0, [ name, '', '', '', '', '', '' ]);
      prev = course;
      i++;
    }
  }
}

function addInstructorHeaders(ws) {
  for (let i = 2; i < ws.rowCount; i++) {
    const isTimeHeader = !ws.getRow(i).getCell(2).value;
    if (isTimeHeader && !String(ws.getRow(i).getCell(1).value).includes(':')) {
      const instr = ws.getRow(i+1).getCell(3).value;
      ws.getRow(i).getCell(1).value += ` - ${instr}`;
    }
  }
}

module.exports = async function(buffer, opts, instructors) {
  // 1. parse CSV
  const records = parse(buffer, { columns: true });
  // 2. build DataFrame equivalent
  const out = records.map(r => {
    const row = {};
    if (opts.roster_by_session) {
      row.EventID      = r.EventID;
      row.EventTime    = r.EventTime;
      row.Instructor   = instructors[r.EventID];
      row.Service      = r.Service;
      row.AttendeeName = r.AttendeeName;
      row.Phone        = r.Phone;
    } else {
      row.EventID      = r.EventID;
      row.EventTime    = r.EventTime;
      row.Instructor   = instructors[r.EventID];
      row.ServiceName  = r.ServiceName;
      row.AttendeeName = r.AttendeeName;
      row.AttendeePhone= r.AttendeePhone;
    }
    return row;
  });

  // 3. write to Excel
  const wb = new Excel.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRows(out);

  // default font
  ws.eachRow(r => r.eachCell(c => c.font = { size: 12 } ));

  // apply headers
  if (opts.time_headers)       addTimeHeaders(ws);
  if (opts.course_headers)     addCourseHeaders(ws);
  if (opts.instructor_headers) addInstructorHeaders(ws);

  // bold / center / borders
  ws.eachRow((row, i) => {
    const isHeader = !row.getCell(2).value;
    if (isHeader) {
      if (opts.bold_time    && String(row.getCell(1).value).includes(':')) row.getCell(1).font = { bold: true };
      if (opts.bold_course  && !String(row.getCell(1).value).includes(':')) row.getCell(1).font = { bold: true };
      if (opts.center_time  && String(row.getCell(1).value).includes(':')) row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      if (opts.center_course&& !String(row.getCell(1).value).includes(':')) row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    }

    if (opts.borders) {
      row.eachCell(cell => {
        cell.border = {
          top:    { style: 'thin' },
          left:   { style: 'thin' },
          bottom: { style: 'thin' },
          right:  { style: 'thin' }
        };
      });
    }
  });

  // auto-width
  ws.columns.forEach(col => {
    let mx = 0;
    col.eachCell(c => mx = Math.max(mx, String(c.value||'').length));
    col.width = mx + 2;
  });
  ws.getColumn(1).width = 10;

  const buf = await wb.xlsx.writeBuffer();
  const now = new Date();
  const fn  = `MasterList_${now.getMonth()+1}_${now.getDate()}_${now.getFullYear()}.xlsx`;
  return { buffer: buf, filename: fn };
};
