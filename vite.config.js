import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    warmup: {
      clientFiles: [
        './src/pages/EmployeesPage.jsx',
        './src/pages/AttendancesPage.jsx',
        './src/pages/LeaveRequestsPage.jsx',
        './src/pages/AttestationsPage.jsx',
        './src/pages/PayrollPage.jsx',
        './src/pages/RecruitmentPage.jsx',
        './src/pages/TalentPoolPage.jsx',
      ],
    },
  },
})