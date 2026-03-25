import { RouterProvider } from 'react-router';
import { router } from './routes';
import { RealtimeProvider } from '../lib/RealtimeContext';

export default function App() {
  return (
    <RealtimeProvider>
      <RouterProvider router={router} />
    </RealtimeProvider>
  );
}
