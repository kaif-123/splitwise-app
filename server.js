const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const path = require('path');
app.use(express.static(path.join(__dirname)));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/import', require('./routes/import'));

app.get('/', (req, res) => {
  res.json({ message: 'Splitwise API running' });
});

console.log(require('./routes/auth'));
console.log(require('./routes/groups'));
console.log(require('./routes/expenses'));
console.log(require('./routes/import'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});