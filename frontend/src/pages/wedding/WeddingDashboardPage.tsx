import { useNavigate } from 'react-router-dom';
import Dashboard from '../../wedding/pages/Dashboard';

export default function WeddingDashboardPage() {
  const navigate = useNavigate();

  const handleGoto = (route: string) => {
    switch (route) {
      case 'projects':
        navigate('/wedding/projects');
        break;
      case 'clients':
        navigate('/wedding/clients');
        break;
      case 'leads':
        navigate('/wedding/leads');
        break;
      case 'calendar':
        navigate('/wedding/calendar');
        break;
      case 'attendance':
        navigate('/wedding/attendance');
        break;
      case 'deliverables':
        navigate('/wedding/deliverables');
        break;
      case 'financials':
        navigate('/wedding/payments');
        break;
      case 'team':
        navigate('/wedding/team');
        break;
      case 'chat':
        navigate('/wedding/chat');
        break;
      case 'create-project':
        navigate('/wedding/projects');
        break;
      default:
        navigate('/wedding/projects');
    }
  };

  return <Dashboard goto={handleGoto} />;
}
