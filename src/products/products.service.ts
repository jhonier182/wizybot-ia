// src/products/products.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Product } from './product.interface';

@Injectable()
export class ProductsService {
    private products: Product[] = [];

    constructor() {
        this.loadProducts();
    }

    private loadProducts() {
        try {
            const filePath = path.join(process.cwd(), 'src', 'data', 'products_list.csv');
            const raw = fs.readFileSync(filePath, 'utf8');

            const lines = raw.split('\n').filter((l) => l.trim().length > 0);
            // First line is the header
            const [, ...dataLines] = lines;

            this.products = dataLines.map((line) => this.parseCsvLine(line)).filter(Boolean) as Product[];
        } catch (error) {
            console.error('Error loading products_list.csv:', error);
            throw new InternalServerErrorException('Could not load products catalog');
        }
    }

    // Basic parser, assuming text fields are wrapped in double quotes
    private parseCsvLine(line: string): Product | null {
        // To keep it simple, we use a naive split:
        const values = this.simpleCsvSplit(line);
        if (values.length < 9) return null;

        const [
            displayTitle,
            embeddingText,
            url,
            imageUrl,
            productType,
            discount,
            price,
            variants,
            createDate,
        ] = values;

        return {
            displayTitle,
            embeddingText,
            url,
            imageUrl,
            productType,
            discount: Number(discount),
            price,
            variants,
            createDate,
        };
    }

    // Basic CSV split that respects double quotes (not perfect, but sufficient for this dataset)
    private simpleCsvSplit(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }

            if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        if (current.length > 0) {
            result.push(current.trim());
        }

        return result;
    }

    /**
     * Search for products related to the user's query.
     * Returns at most 2 products sorted by relevance.
     */
    search(query: string): Product[] {
        const q = query.toLowerCase();

        const scored = this.products.map((p) => {
            const title = p.displayTitle.toLowerCase();
            const desc = p.embeddingText.toLowerCase();

            let score = 0;
            if (title.includes(q)) score += 2;
            if (desc.includes(q)) score += 1;

            // Optionally, you can add more rules (by productType, etc.)
            return { product: p, score };
        });

        return scored
            .filter((s) => s.score > 0)         // only products somewhat related
            .sort((a, b) => b.score - a.score)  // higher score first
            .slice(0, 2)                        // at most 2
            .map((s) => s.product);
    }
}