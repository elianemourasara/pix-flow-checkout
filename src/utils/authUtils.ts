
import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a secure random password
 */
export const generatePassword = (length = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  
  // Ensure at least one uppercase, one lowercase, one number and one special char
  password += chars[Math.floor(Math.random() * 26)]; // uppercase
  password += chars[Math.floor(Math.random() * 26) + 26]; // lowercase
  password += chars[Math.floor(Math.random() * 10) + 52]; // number
  password += chars[Math.floor(Math.random() * (chars.length - 62)) + 62]; // special
  
  // Fill the rest of the password
  for (let i = 4; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Shuffle the password characters
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
};

/**
 * Creates a new user with the provided email and password
 */
export const createUser = async (email: string, password: string, name?: string) => {
  try {
    // Create the user in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        { email, password, name }
      ])
      .select('id')
      .single();
      
    if (userError) {
      console.error('Error creating user:', userError);
      throw userError;
    }
    
    console.log('User created successfully:', userData);
    return userData;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
};

/**
 * Grants course access to a user by creating a user_courses record
 */
export const grantCourseAccess = async (userId: string, courseId: string) => {
  try {
    const { error } = await supabase
      .from('user_courses')
      .insert([
        { user_id: userId, course_id: courseId }
      ]);
      
    if (error) {
      console.error('Error granting course access:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in grantCourseAccess:', error);
    throw error;
  }
};
