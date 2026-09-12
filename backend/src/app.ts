import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import leadRoutes from './routes/lead.routes';
import projectRoutes from './routes/project.routes';
import eventRoutes from './routes/event.routes';
import packageRoutes from './routes/package.routes';
import contractRoutes from './routes/contract.routes';
import paymentRoutes from './routes/payment.routes';
import invoiceRoutes from './routes/invoice.routes';
import employeeRoutes from './routes/employee.routes';
import taskRoutes from './routes/task.routes';
import deliverableRoutes from './routes/deliverable.routes';
import interactionRoutes from './routes/interaction.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportRoutes from './routes/report.routes';
import notificationRoutes from './routes/notification.routes';
import searchRoutes from './routes/search.routes';
import modelRoutes from './routes/model.routes';
import garmentRoutes from './routes/garment.routes';
import bookingRoutes from './routes/booking.routes';
import attendanceRoutes from './routes/attendance.routes';
import expenseRoutes from './routes/expense.routes';
import fashionExtraRoutes from './routes/fashion.routes';

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow any origin in production or development to ensure frontend connectivity
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Photo Fashion Studio CRM API is running', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/clients', customerRoutes); // Alias for CRM Clients
app.use('/api/leads', leadRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/garments', garmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/fashion', fashionExtraRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/deliverables', deliverableRoutes);
app.use('/api', interactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
