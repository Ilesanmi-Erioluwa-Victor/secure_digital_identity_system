export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-primary mb-4">
              <span className="text-white text-2xl font-bold">D</span>
            </div>
            <h1 className="text-xl font-bold text-primary-dark">
              Secure Identity System
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              DSPoly Library
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
