import { AuthProvider, useAuth } from './presentation/context/AuthContext';
import { LoginPage } from './presentation/pages/LoginPage';
import { DashboardPage } from './presentation/pages/DashboardPage';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="spinner-large"></div>
      </div>
    );
  }

  return isAuthenticated ? <DashboardPage /> : <LoginPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

