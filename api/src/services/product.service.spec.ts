import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProduct, getVariantsByBarcode } from './product.service.js';
import { prisma } from '../lib/prisma.js';
import { ConflictError, NotFoundError } from '../errors/app-error.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    product: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Product Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product with variants successfully', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Desc',
        variants: [
          {
            barcode: '123456789',
            sku: 'TEST-SKU-1',
            description: 'Variant 1',
            price: 10.5,
            cost: 5.0,
            quantity: 5,
          },
        ],
      };

      vi.mocked(prisma.productVariant.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.product.create).mockResolvedValueOnce({
        id: 'some-uuid',
        name: productData.name,
        description: productData.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        variants: [
          {
            id: 'variant-uuid',
            productId: 'some-uuid',
            ...productData.variants[0],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      } as any);

      const result = await createProduct(productData);

      expect(prisma.productVariant.findUnique).toHaveBeenCalledWith({
        where: { sku: productData.variants[0].sku },
      });
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: productData.name,
          description: productData.description,
          variants: {
            create: productData.variants,
          },
        },
        include: {
          variants: true,
        },
      });
      expect(result.id).toBe('some-uuid');
      expect(result.variants).toHaveLength(1);
    });

    it('should throw ConflictError if variant SKU already exists', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Desc',
        variants: [
          {
            barcode: '123456789',
            sku: 'TEST-SKU-1',
            description: 'Variant 1',
            price: 10.5,
            cost: 5.0,
            quantity: 5,
          },
        ],
      };

      vi.mocked(prisma.productVariant.findUnique).mockResolvedValueOnce({
        id: 'existing-var-id',
        productId: 'existing-prod-id',
        barcode: '123456789',
        sku: 'TEST-SKU-1',
        description: 'Existing',
        price: 10,
        cost: 5,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(createProduct(productData)).rejects.toThrow(ConflictError);
      expect(prisma.product.create).not.toHaveBeenCalled();
    });
  });

  describe('getVariantsByBarcode', () => {
    it('should return matching variants', async () => {
      const barcode = '123456789';
      const mockVariants = [
        {
          id: 'v1',
          productId: 'p1',
          barcode,
          sku: 'SKU1',
          description: 'P ao GG',
          price: 229,
          cost: 150,
          quantity: 10,
          product: { id: 'p1', name: 'Calça de pesca', description: null },
        },
      ];

      vi.mocked(prisma.productVariant.findMany).mockResolvedValueOnce(mockVariants as any);

      const result = await getVariantsByBarcode(barcode);

      expect(prisma.productVariant.findMany).toHaveBeenCalledWith({
        where: { barcode },
        include: { product: true },
      });
      expect(result).toEqual(mockVariants);
    });

    it('should throw NotFoundError if no variants found', async () => {
      vi.mocked(prisma.productVariant.findMany).mockResolvedValueOnce([]);

      await expect(getVariantsByBarcode('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});
