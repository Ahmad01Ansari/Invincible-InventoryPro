import { useEffect, useState } from 'react';
// @ts-ignore - The react-joyride community typings cause ESM interop linting errors in strict mode
import Joyride, { Step } from 'react-joyride';
import { useAuthStore } from '@/stores/authStore';

export default function WalkthroughTour() {
  const { hasSeenTour, markTourAsSeen, isAuthenticated } = useAuthStore();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only automatically mount the tour if they are logged in and haven't seen it yet.
    if (isAuthenticated && hasSeenTour === false) {
      // Slight delay to ensure DOM is fully rendered before targeting IDs
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, isAuthenticated]);

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: 'Welcome to the Platform!',
      content: "Let's take a quick 30-second tour to understand how to navigate your new SaaS Inventory workspace.",
    },
    {
      target: '#nav-dashboard',
      title: 'Your Command Center',
      content: 'Here you track overall revenue, low-stock alerts, and daily inventory movements across all your workflows.',
      placement: 'right',
    },
    {
      target: '#nav-inventory',
      title: 'Physical Stock Management',
      content: 'Manually adjust stock volumes after migrating from Excel, or track multi-warehouse capacities.',
      placement: 'right',
    },
    {
      target: '#nav-sales',
      title: 'Sales & Invoicing',
      content: 'Create rapid point-of-sale transactions. This securely auto-deducts the sold items directly from your live inventory.',
      placement: 'right',
    },
    {
      target: '#nav-settings',
      title: 'Global Settings & Staff',
      content: 'Finally, register your Warehouses or invite your Staff teammates to collaborate with specific customized role permissions here!',
      placement: 'right',
    }
  ];

  const handleCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    // If the user closed or fully hit "Done", we log it to memory and turn it off forever
    if (finishedStatuses.includes(status)) {
      setRun(false);
      markTourAsSeen();
    }
  };

  return (
    <Joyride
      callback={handleCallback}
      continuous
      hideCloseButton={false}
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
    />
  );
}
