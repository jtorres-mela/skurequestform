import SubmitToSmartlingPopup from "@/lib/components/SubmitToSmartlingPopup";
import { formatDateAsUTC } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const formatDate = (date: Date | null) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default async function SkuInfoPage(context: { params: { id: string } }) {
  const product = await prisma.submissionProduct.findUnique({
    where: { id: Number(context.params.id) },
    include: {
      submission: true,
      accessories: true,
      cultures: true,
      recommendations: true,
      markets: {
        orderBy: {
          market: 'asc',
        },
      },
    },
  });

  if (!product) {
    return <div className="p-6">Product not found</div>;
  }

  const renderSection = (title: string, content: React.ReactNode) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">{title}</h2>
      {content}
    </div>
  );

  const renderKeyValueRow = (label: string, value: React.ReactNode) => (
    <tr className="border-b border-gray-200">
      <td className="py-3 px-4 font-medium text-gray-700 bg-gray-50 w-1/4">
        {label}
      </td>
      <td className="py-3 px-4">{value || 'N/A'}</td>
    </tr>
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold mb-6">SKU Details: {product.sku}</h1>
        <div>
          <SubmitToSmartlingPopup sku={product} />
          <Link href={`/request/${product.submission.requestId}`} className="ml-4">Back to Request</Link>
        </div>
      </div>
      
      
      {renderSection('Core Information', (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200">
              {renderKeyValueRow('Product Name', product.productName)}
              {renderKeyValueRow('SKU', product.sku)}
              {renderKeyValueRow('Version', product.version)}
              {renderKeyValueRow('Short Description', product.shortDescription)}
              {renderKeyValueRow('Long Description', product.longDescription)}
            </tbody>
          </table>
        </div>
      ))}

      {renderSection('Marketing Information', (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200">
              {renderKeyValueRow('Stamp', product.stamp)}
              {renderKeyValueRow('Off-Sale Message', product.offSaleMessage)}
              {renderKeyValueRow('PDP Requested', product.isPdpRequested ? 'Yes' : 'No')}
              {product.isPdpRequested && renderKeyValueRow('PDP Work Request', product.pdpWorkRequest)}
            </tbody>
          </table>
        </div>
      ))}

      {product.includeTranslations && product.cultures.length > 0 && renderSection('Translations', (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Culture
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Short Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Long Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {product.cultures.map((culture) => (
                <tr key={culture.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{culture.cultureCode}</td>
                  <td className="px-4 py-3">{culture.translatedName || 'N/A'}</td>
                  <td className="px-4 py-3">{culture.translatedShort || 'N/A'}</td>
                  <td className="px-4 py-3">{culture.translatedLong || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {product.accessories.length > 0 && renderSection('Accessories', (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Label
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {product.accessories.map((accessory) => (
                <tr key={accessory.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{accessory.accessorySku || 'N/A'}</td>
                  <td className="px-4 py-3">{accessory.accessoryLabel || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {product.recommendations.length > 0 && renderSection('Recommended SKUs', (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommended SKU
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {product.recommendations.map((rec) => (
                <tr key={rec.id}>
                  <td className="px-4 py-3">{rec.recommendedSku || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {product.markets.length > 0 && renderSection('Market Information', (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Savings
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UOM
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On Sale Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Off Sale Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {product.markets.map((market) => (
                <tr key={market.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{market.market}</td>
                  <td className="px-4 py-3">
                    {market.noSavings ? 'No Savings' : 
                     `${market.savings} ${market.currency || ''}`.trim()}
                  </td>
                  <td className="px-4 py-3">
                    {market.uomValue && market.uomTitle 
                      ? `${market.uomValue} ${market.uomTitle}` 
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {market.onSaleDate ? formatDateAsUTC(market.onSaleDate) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {market.noEndDate ? 'No End Date' : 
                     (market.offSaleDate ? formatDateAsUTC(market.offSaleDate) : 'N/A')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-500">
        <p>Created: {formatDate(product.createdAt)}</p>
        <p>Last Updated: {formatDate(product.updatedAt)}</p>
      </div>
    </div>
  );
}
