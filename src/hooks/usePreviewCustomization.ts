
import { useState, useEffect } from 'react';
import { URLSearchParamsInit } from 'react-router-dom';
import { CheckoutCustomization } from '@/types/checkout';
import { Product } from '@/types/checkout';
import { getDemoProduct } from '@/utils/previewUtils';

// Default customization values
const defaultCustomization: CheckoutCustomization = {
  buttonColor: '#6E59A5',
  buttonText: 'Finalizar Compra',
  headingColor: '#6E59A5',
  bannerImageUrl: null,
  topMessage: 'Oferta por tempo limitado!',
  countdownEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  isDigitalProduct: true
};

export const usePreviewCustomization = (searchParams: URLSearchParams) => {
  const [customization, setCustomization] = useState<CheckoutCustomization>(defaultCustomization);
  const [demoProduct, setDemoProduct] = useState<Product>(getDemoProduct());

  useEffect(() => {
    // Parse customization from URL parameters
    const buttonColor = searchParams.get('buttonColor') || defaultCustomization.buttonColor;
    const buttonText = searchParams.get('buttonText') || defaultCustomization.buttonText;
    const headingColor = searchParams.get('headingColor') || defaultCustomization.headingColor;
    const bannerImageUrl = searchParams.get('bannerImageUrl') || defaultCustomization.bannerImageUrl;
    const topMessage = searchParams.get('topMessage') || defaultCustomization.topMessage;
    const countdownEndTime = searchParams.get('countdownEndTime') || defaultCustomization.countdownEndTime;
    const isDigitalProduct = searchParams.get('isDigitalProduct') !== 'false';

    // Update demo product's digital status based on URL params
    const product = getDemoProduct();
    product.isDigital = isDigitalProduct;
    setDemoProduct(product);

    setCustomization({
      buttonColor,
      buttonText,
      headingColor,
      bannerImageUrl,
      topMessage,
      countdownEndTime,
      isDigitalProduct
    });
  }, [searchParams]);

  return { customization, demoProduct };
};
