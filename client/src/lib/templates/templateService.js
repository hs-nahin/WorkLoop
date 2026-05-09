import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const TEMPLATES_COLLECTION = 'taskTemplates';

export async function createTemplate(templateData) {
  try {
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...templateData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...templateData };
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

export async function getTemplates() {
  try {
    const q = query(collection(db, TEMPLATES_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

export async function updateTemplate(id, templateData) {
  try {
    const templateRef = doc(db, TEMPLATES_COLLECTION, id);
    await updateDoc(templateRef, {
      ...templateData,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

export async function deleteTemplate(id) {
  try {
    const templateRef = doc(db, TEMPLATES_COLLECTION, id);
    await deleteDoc(templateRef);
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}
