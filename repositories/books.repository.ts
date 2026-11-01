import { IBook } from "../models/book";


export abstract class BooksRepository {
  abstract createBook(book: IBook): void;

  abstract getBook(id: number): IBook | null;

  abstract getBooks(): IBook[];

  abstract updateBook(id: number, updatedBook: IBook): void;

  abstract deleteBook(id: number): void;
}