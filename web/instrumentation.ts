export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_PHASE !== 'phase-production-build') {
    const { getControlPlaneService } = await import('./lib/control-plane/service');
    // Start the host listener independently of viewers and admin page visits.
    void getControlPlaneService()
      .init()
      .catch((error) => console.error('Control-plane initialization failed', error));
  }
}
