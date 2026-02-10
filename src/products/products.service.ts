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
     * Uses word-based matching with stopwords and synonym expansion.
     * Returns at most 2 products sorted by relevance.
     */
    search(query: string): Product[] {
        const stopWords = new Set([
            'i', 'am', 'is', 'are', 'a', 'an', 'the', 'for', 'my', 'your', 'in', 'on', 'at',
            'looking', 'want', 'need', 'what', 'how', 'much', 'does', 'do', 'can', 'me', 'it', 'to',
        ]);
        const queryExpansion: Record<string, string[]> = {
            dad: ['men', 'mens', "men's", 'man', 'boys', 'father'],
            father: ['men', 'mens', "men's", 'man', 'boys', 'dad'],
            present: ['gift'],
            gift: ['present'],
            watch: ['reloj', 'watch'],
            phone: ['iphone', 'celulares', 'phone'],
        };

        const words = query
            .toLowerCase()
            .replace(/[^\w\s']/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length > 1 && !stopWords.has(w));

        const searchTerms = new Set<string>(words);
        words.forEach((w) => {
            (queryExpansion[w] || []).forEach((t) => searchTerms.add(t));
        });
        if (searchTerms.size === 0) {
            return this.products.slice(0, 2);
        }

        const wordBoundaryMatch = (text: string, term: string): boolean => {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp('\\b' + escaped + '\\b', 'i').test(text);
        };

        const scored = this.products.map((p) => {
            const title = p.displayTitle.toLowerCase();
            const desc = p.embeddingText.toLowerCase();
            const type = (p.productType || '').toLowerCase();

            let score = 0;
            for (const term of searchTerms) {
                if (wordBoundaryMatch(title, term)) score += 2;
                else if (wordBoundaryMatch(desc, term) || wordBoundaryMatch(type, term)) score += 1;
            }
            return { product: p, score };
        });

        const filtered = scored.filter((s) => s.score > 0);
        if (filtered.length === 0) {
            return this.products.slice(0, 2);
        }
        return filtered
            .sort((a, b) => b.score - a.score)
            .slice(0, 2)
            .map((s) => s.product);
    }
}