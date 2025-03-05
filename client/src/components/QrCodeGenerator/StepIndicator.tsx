interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const steps = [
    { number: 1, label: "Upload File" },
    { number: 2, label: "Configure" },
    { number: 3, label: "Generate" }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number}>
            <div className={`flex items-center ${currentStep >= step.number ? 'text-primary font-medium' : 'text-gray-400'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep >= step.number ? 'border-primary bg-primary text-white' : 'border-gray-300'
              }`}>
                {step.number}
              </div>
              <span className="ml-2 text-sm">{step.label}</span>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-grow mx-2 h-0.5 bg-gray-200 hidden sm:block" 
                   style={{width: "100%"}} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
