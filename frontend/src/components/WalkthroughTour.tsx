import { useEffect, useState } from 'react';
// @ts-ignore - The react-joyride community typings cause ESM interop linting errors in strict mode
import * as JoyrideModule from 'react-joyride';
import { Step, TooltipRenderProps } from 'react-joyride';
// @ts-ignore
const Joyride = ((JoyrideModule as any).default || (JoyrideModule as any).Joyride || JoyrideModule) as any;
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
    const { status, action } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    // If the user closed, skipped, or fully hit "Done", we log it to memory and turn it off forever
    if (finishedStatuses.includes(status) || action === 'close') {
      setRun(false);
      markTourAsSeen();
    }
  };

  // 3D Glassmorphic Custom Tooltip design
  const CustomTooltip = ({
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    tooltipProps,
    isLastStep
  }: TooltipRenderProps) => {
    return (
      <div 
        {...tooltipProps}
        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/40 dark:border-slate-800/50 p-6 rounded-3xl w-[350px] shadow-[0_30px_60px_-15px_rgba(79,_70,_229,_0.3)] transform transition-all duration-500 ease-out animate-in zoom-in-95"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_8px_16px_rgba(79,_70,_229,_0.4)]">
            <span className="text-white font-extrabold text-lg">{index + 1}</span>
          </div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-400 dark:to-purple-400 leading-tight">
            {step.title}
          </h3>
        </div>
        
        <div className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed mb-8 font-medium">
          {step.content}
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <button
            {...closeProps}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors px-2 py-1"
          >
            Skip Tour
          </button>
          
          <div className="flex gap-3">
            {index > 0 && (
              <button
                {...backProps}
                className="px-4 py-2 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              {...primaryProps}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 transform hover:-translate-y-0.5"
            >
              {continuous ? (isLastStep ? 'Finish Setup' : 'Next Step') : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
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
      tooltipComponent={CustomTooltip}
      floaterProps={{
        disableAnimation: false,
        styles: {
          options: {
            zIndex: 10000,
          },
        },
      }}
    />
  );
}
