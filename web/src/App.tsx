import {createBrowserRouter, Navigate, RouterProvider} from 'react-router-dom'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {IS_CONFIGURED, MISSING_ENV} from '@/lib/env'
import {SessionProvider} from '@/state/session'
import {Layout} from '@/components/Layout'
import {RequireAuth} from '@/components/RequireAuth'
import {HomePage} from '@/routes/Home'
import {AuthCallbackPage, LoginPage, VerifyPage, WelcomePage} from '@/routes/Auth'
import {VehicleFormPage, VehiclesPage} from '@/routes/Vehicles'
import {AccountPage} from '@/routes/Account'
import {AboutPage, NotFoundPage, PrivacyPage, TermsPage} from '@/routes/Info'
import {FileFormPage, FilesPage, StartFilePage} from '@/routes/Files'
import {FileDetailPage} from '@/routes/FileDetail'
import {PublicSlipPage, SlipEditorPage} from '@/routes/Slip'
import {LetterPage} from '@/routes/Letter'
import {PackPage} from '@/routes/Pack'
import {OfficesPage} from '@/routes/Offices'
import {AskPage} from '@/routes/Ask'
import {NearbyPage} from '@/routes/Nearby'
import {BusinessPage} from '@/routes/business/Business'
import {ClaimPage} from '@/routes/business/Claim'
import {TeamPage} from '@/routes/business/Team'
import {InvitePage} from '@/routes/business/Invite'
import {AdminClaimsPage} from '@/routes/business/AdminClaims'
import {LeadsPage} from '@/routes/business/Leads'
import {LeadDetailPage} from '@/routes/business/LeadDetail'
import {CustomersPage} from '@/routes/business/Customers'
import {ChatPage} from '@/routes/business/Chat'
import {TasksPage} from '@/routes/business/Tasks'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {staleTime: 30_000, retry: 1, refetchOnWindowFocus: false},
  },
})

/** Booking screens from the old marketplace. Their links still go somewhere useful. */
const RETIRED = [
  '/search',
  '/services/:categoryId',
  '/cart',
  '/quotes',
  '/shops',
  '/shops/:storeId',
  '/parts',
  '/checkout/:storeId',
  '/orders',
  '/orders/:orderId',
  '/orders/:orderId/review',
  '/notifications',
]

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {path: '/', element: <HomePage />},
      // The fair job guide is gone. Old links go home.
      {path: '/guide', element: <Navigate to="/" replace />},
      {path: '/guide/:job', element: <Navigate to="/" replace />},
      {path: '/offices', element: <OfficesPage />},
      // Top shops nearby. Public: looking needs no account. Starting a file from it does.
      {path: '/nearby', element: <NearbyPage />},
      {path: '/s/:code', element: <PublicSlipPage />},
      {path: '/login', element: <LoginPage />},
      {path: '/login/verify', element: <VerifyPage />},
      {path: '/auth/callback', element: <AuthCallbackPage />},
      {path: '/terms', element: <TermsPage />},
      {path: '/privacy', element: <PrivacyPage />},
      {path: '/about', element: <AboutPage />},
      {path: '/vehicles', element: <Navigate to="/account/vehicles" replace />},
      // History now lives in Repairs, newest trip first.
      {path: '/history', element: <Navigate to="/files" replace />},
      ...RETIRED.map(path => ({path, element: <Navigate to="/" replace />})),
      {
        element: <RequireAuth />,
        children: [
          {path: '/welcome', element: <WelcomePage />},
          {path: '/files', element: <FilesPage />},
          {path: '/files/new', element: <StartFilePage />},
          {path: '/files/:id', element: <FileDetailPage />},
          {path: '/files/:id/edit', element: <FileFormPage />},
          {path: '/files/:id/slip', element: <SlipEditorPage />},
          {path: '/files/:id/letter', element: <LetterPage />},
          {path: '/files/:id/pack', element: <PackPage />},
          {path: '/ask', element: <AskPage />},
          {path: '/account', element: <AccountPage />},
          {path: '/account/vehicles', element: <VehiclesPage />},
          {path: '/account/vehicles/new', element: <VehicleFormPage />},
          {path: '/account/vehicles/:vehicleId', element: <VehicleFormPage />},
          // For shops. Shops see only their own data. Repair files stay private unless shared.
          {path: '/business', element: <BusinessPage />},
          {path: '/business/claim', element: <ClaimPage />},
          {path: '/business/team', element: <TeamPage />},
          {path: '/business/invite/:token', element: <InvitePage />},
          {path: '/business/admin/claims', element: <AdminClaimsPage />},
          {path: '/business/leads', element: <LeadsPage />},
          {path: '/business/leads/:id', element: <LeadDetailPage />},
          {path: '/business/customers', element: <CustomersPage />},
          {path: '/business/chat', element: <ChatPage />},
          {path: '/business/tasks', element: <TasksPage />},
        ],
      },
      {path: '*', element: <NotFoundPage />},
    ],
  },
])

export function App() {
  if (!IS_CONFIGURED) return <SetupNotice />
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>
  )
}

function SetupNotice() {
  return (
    <main className="container">
      <div className="card setup stack">
        <img src="/images/kumpooni-logo.png" alt="Kumpooni" width={160} />
        <h1 style={{fontSize: 'var(--text-xl)'}}>Connect the web app to Supabase</h1>
        <p>
          <code>web/.env</code> is missing {MISSING_ENV.join(' and ')}. Save the file, then stop and start{' '}
          <code>npm run dev</code>. Vite only reads the file on start.
        </p>
        <pre>{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
VITE_GOOGLE_MAPS_KEY=your-google-maps-key`}</pre>
        <p className="small muted">
          The anon or publishable key is in Supabase under Project Settings, API. The Google key turns on the
          satellite map of DTI offices. Without it, the app links to Google Earth and Google Maps instead.
        </p>
      </div>
    </main>
  )
}
