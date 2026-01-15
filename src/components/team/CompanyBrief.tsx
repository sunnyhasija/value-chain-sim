'use client';

interface CompanyBriefProps {
  teamName: string;
  onContinue: () => void;
}

export function CompanyBrief({ teamName, onContinue }: CompanyBriefProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-800 text-white p-6">
          <h1 className="text-3xl font-bold">FRESHMART GROCERIES</h1>
          <p className="text-blue-200 mt-1">Regional Grocery Chain</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Welcome */}
          <div className="text-center pb-4 border-b">
            <p className="text-gray-600">Welcome,</p>
            <p className="text-2xl font-bold text-blue-900">{teamName}</p>
          </div>

          {/* Company Overview */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              COMPANY OVERVIEW
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You are the executive team of FreshMart, a regional grocery chain
              operating 45 stores across the Midwest. Founded in 1985, the company
              has grown steadily through a commitment to quality and customer
              service. However, you now face increasing competition from national
              chains and e-commerce disruptors.
            </p>
          </div>

          {/* Financial Position */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              FINANCIAL POSITION
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">$1.0B</div>
                <div className="text-sm text-gray-500">Annual Revenue</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">$50M</div>
                <div className="text-sm text-gray-500">Operating Profit (5%)</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">$50M</div>
                <div className="text-sm text-gray-500">Investment Budget/Quarter</div>
              </div>
            </div>
          </div>

          {/* Challenge */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              YOUR CHALLENGE
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Over the next 4 quarters, you must allocate your investment budget
              across value chain activities to build sustainable competitive
              advantage. The market is fierce; your competitors are making their
              own moves.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-yellow-800 font-medium">Key Insight:</p>
              <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                <li>
                  &bull; Some activities <strong>create value directly</strong> for
                  customers
                </li>
                <li>
                  &bull; Some activities <strong>support</strong> value creation
                </li>
                <li>
                  &bull; Some activities may{' '}
                  <strong>not add value at all</strong>
                </li>
                <li>
                  &bull; Strategic <strong>fit</strong> between activities can
                  amplify results
                </li>
              </ul>
            </div>
          </div>

          {/* Warning */}
          <div className="text-center text-gray-600 italic">
            &quot;Choose wisely. Your competitors are watching.&quot;
          </div>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            BEGIN SIMULATION
          </button>
        </div>
      </div>
    </div>
  );
}
