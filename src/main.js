/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase;
   const revenue = sale_price * quantity * (1 - discount / 100);
    return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    if (index === 0) {
        return seller.profit * 0.15;
    } else if (index === 1 || index === 2) {
        return seller.profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return seller.profit * 0.05;
    }
}

function analyzeSalesData(data, options) {
    // Проверка входных данных
    if (
        !data ||
        !data.sellers ||
        !data.products ||
        !data.purchase_records
    ) {
        console.log('Ошибка: отсутствуют входные данные');
        return;
    }

    if (
        data.sellers.length === 0 ||
        data.products.length === 0 ||
        data.purchase_records.length === 0
    ) {
        console.log('Ошибка: один из списков пуст');
        return;
    }

    // Проверка наличия опций
    if (
        !options ||
        !options.calculateRevenue ||
        !options.calculateBonus
    ) {
        console.log('Ошибка: отсутствуют необходимые опции');
        return;
    }

    // Подготовка промежуточных данных для сбора статистики
    const sellersStats = data.sellers.map(seller => {
        return {
            id: seller.id,
            name: seller.first_name + ' ' + seller.last_name,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {}
        };
    });

    // Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = {};
    const productIndex = {};

    sellersStats.forEach(seller => {
        sellerIndex[seller.id] = seller;
    });

    data.products.forEach(product => {
        productIndex[product.sku] = product;
    });

    // Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];

        if (!seller) {
            return;
        }

        seller.sales_count++;
        seller.revenue += record.total_amount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];

            if (!product) {
                return;
            }

            const revenue = options.calculateRevenue(item, product);
            const cost = product.purchase_price * item.quantity;

            seller.profit += revenue - cost;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }

            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // Сортировка продавцов по прибыли
    sellersStats.sort((a, b) => b.profit - a.profit);

    // Назначение премий на основе ранжирования
    const total = sellersStats.length;

    sellersStats.forEach((seller, index) => {
        seller.bonus = options.calculateBonus(index, total, seller);
    });

    // Подготовка итоговой коллекции с нужными полями
    return sellersStats.map(seller => {
        const topProducts = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => {
                return {
                    sku: sku,
                    quantity: quantity
                };
            })
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        return {
            seller_id: seller.id,
            name: seller.name,
            revenue: +seller.revenue.toFixed(2),
            profit: +seller.profit.toFixed(2),
            sales_count: seller.sales_count,
            top_products: topProducts,
            bonus: +seller.bonus.toFixed(2)
        };
    });
}