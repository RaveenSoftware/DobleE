import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import toppingRoutes from './routes/toppings';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import branchRoutes from './routes/branches';
import staffRoutes from './routes/staff';
import customerRoutes from './routes/customers';
import tableRoutes from './routes/tables';
import expenseRoutes from './routes/expenses';
import inventoryRoutes from './routes/inventory';
import rewardRoutes from './routes/rewards';
import cashShiftRoutes from './routes/cashshift';
import flavorRoutes from './routes/flavors';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/toppings', toppingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/cashshift', cashShiftRoutes);
app.use('/api/flavors', flavorRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '2.0.0', message: 'Granizado DobleE API ✓ Full Persistence' });
});

app.listen(port, () => {
  console.log(`\n🍧 Granizado DobleE Backend`);
  console.log(`  → Running on: http://localhost:${port}`);
  console.log(`  → Health: http://localhost:${port}/api/health\n`);
});
