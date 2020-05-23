import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const newProduct = await this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(newProduct);

    return newProduct;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const searchedProduct = await this.ormRepository.findOne({
      where: { name },
    });

    return searchedProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const searchedProducts = await this.ormRepository.find({
      where: { products },
    });

    return searchedProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsToUpdateId = products.map(product => product.id);

    const productsStoredToUpdate = await this.ormRepository.find({
      where: {
        id: In(productsToUpdateId),
      },
    });

    const updatedProducts = products.map(productToUpdate => {
      const productFoundInStorage = productsStoredToUpdate.find(
        storedProduct => storedProduct.id === productToUpdate.id,
      );
      if (!productFoundInStorage) {
        throw new AppError('Products not found in repository');
      }
      const newQuantity =
        productFoundInStorage.quantity - productToUpdate.quantity;

      if (newQuantity < 0) {
        throw new AppError(
          `Insufficient quantity of product ${productFoundInStorage.name}`,
        );
      }
      return {
        ...productFoundInStorage,
        quantity: newQuantity,
      };
    });

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
