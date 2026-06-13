import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc, 
    setDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Funciones para manejar productos en la base de datos
export const getProductsFromDB = async () => {
    if (!db) {
        console.warn("Base de datos no inicializada. Verifica tus credenciales.");
        return [];
    }
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        return products;
    } catch (error) {
        console.error("Error al obtener productos:", error);
        return [];
    }
};

export const updateStockInDB = async (productId, qtyToReduce) => {
    if (!db) return false;
    const productRef = doc(db, "products", productId);
    try {
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
            const currentStock = productSnap.data().stock;
            if (currentStock >= qtyToReduce) {
                await updateDoc(productRef, {
                    stock: currentStock - qtyToReduce
                });
                return true;
            } else {
                alert("No hay suficiente stock para este producto.");
                return false;
            }
        }
        return false;
    } catch (error) {
        console.error("Error actualizando stock:", error);
        return false;
    }
};

// Función auxiliar para subir un producto a Firebase (útil para migración inicial)
export const uploadProductToDB = async (productData) => {
    if(!db) return;
    try {
        // Usamos el ID del producto como el ID del documento en Firestore
        const productRef = doc(db, "products", productData.id.toString());
        await setDoc(productRef, {
            name: productData.name,
            brand: productData.brand,
            category: productData.category,
            price: productData.price,
            img: productData.img,
            description: productData.description || "",
            specs: productData.specs || [],
            stock: 10 // stock inicial por defecto
        });
        console.log(`Producto ${productData.name} subido exitosamente.`);
    } catch(error) {
        console.error("Error subiendo producto:", error);
    }
};
