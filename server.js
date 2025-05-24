const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const processor = require('./services/processor');

const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('csv_file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  // parse JSON fields from form-data
  const options = {
    time_headers:      req.body.time_headers === 'on',
    course_headers:    req.body.course_headers === 'on',
    instructor_headers:req.body.instructor_headers === 'on',
    borders:           req.body.borders === 'on',
    center_time:       req.body.center_time === 'on',
    bold_time:         req.body.bold_time === 'on',
    center_course:     req.body.center_course === 'on',
    bold_course:       req.body.bold_course === 'on',
    roster_by_session: req.body.roster_by_session === 'on',
    roster_by_series:  req.body.roster_by_series === 'on'
  };

  // instructors come as arrays
  const names = Array.isArray(req.body['instructor_names[]'])
    ? req.body['instructor_names[]']
    : [req.body['instructor_names[]']];
  const codes = Array.isArray(req.body['instructor_codes[]'])
    ? req.body['instructor_codes[]']
    : [req.body['instructor_codes[]']];

  const instructors = {};
  names.forEach((n, i) => {
    if (n.trim()) {
      instructors[n.trim()] = codes[i]
        .split(',')
        .map(c => parseInt(c.trim()))
        .filter(Boolean);
    }
  });

  try {
    const { buffer, filename } = await processor(req.file.buffer, options, instructors);
    res
      .set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      })
      .send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing file');
  }
});

app.listen(3000, () => console.log('Listening on http://localhost:3000'));
