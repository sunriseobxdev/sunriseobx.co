import { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

const AdminCMS = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Configuration - These should be environment variables in production
  const ENCRYPTED_GITHUB_TOKEN = process.env.NEXT_PUBLIC_ENCRYPTED_GITHUB_TOKEN;
  const REPO_OWNER = process.env.NEXT_PUBLIC_REPO_OWNER || 'your-username';
  const REPO_NAME = process.env.NEXT_PUBLIC_REPO_NAME || 'sunriseobx.co';
  const MASTER_PASSWORD_HASH = process.env.NEXT_PUBLIC_MASTER_PASSWORD_HASH;
  
  // Decrypted token (only available after authentication)
  const [githubToken, setGithubToken] = useState('');

  // PBKDF2 password verification and token decryption
  const verifyPassword = (inputPassword) => {
    const salt = 'sunrise-cms-salt-2024'; // Use a proper random salt in production
    const hash = CryptoJS.PBKDF2(inputPassword, salt, {
      keySize: 256/32,
      iterations: 10000
    }).toString();
    
    // Verify password hash
    const isValidPassword = hash === MASTER_PASSWORD_HASH || inputPassword === 'admin123'; // Remove fallback in production
    
    if (isValidPassword && ENCRYPTED_GITHUB_TOKEN) {
      // Decrypt GitHub token using the master password
      try {
        const decryptedToken = decryptData(ENCRYPTED_GITHUB_TOKEN, inputPassword);

        if (decryptedToken) {
          setGithubToken(decryptedToken);

          return true;
        }
      } catch (error) {
        return false;
      }
    }
    
    return isValidPassword;
  };

  // Decrypt function
  const decryptData = (encryptedData, password) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, password);

      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      return null;
    }
  };

  // GitHub API functions
  const getFileContent = async (path) => {
    if (!githubToken) {
      return null;
    }
    
    try {
      const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        return {
          content: atob(data.content),
          sha: data.sha
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  const updateFile = async (path, content, message, sha) => {
    if (!githubToken) {
      return false;
    }
    
    try {
      const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content: btoa(content),
          sha,
          branch: 'main' // or 'master' depending on your default branch
        }),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Load editable files list
  useEffect(() => {
    if (isAuthenticated) {
      setFiles([
        'src/data/app.json',
        'src/data/sections/hero.json',
        'src/data/sections/about.json',
        'src/data/sections/services.json',
        'src/data/posts/posts.json',
        'src/data/projects/projects.json',
        'src/data/team/team.json',
        'src/data/sliders/partners.json'
      ]);
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (verifyPassword(password)) {
      setIsAuthenticated(true);
      setMessage('Authentication successful!');
    } else {
      setMessage('Invalid password!');
    }
  };


  const handleFileSelect = async (filePath) => {
    setSelectedFile(filePath);
    setLoading(true);
    
    const fileData = await getFileContent(filePath);

    if (fileData) {
      setContent(fileData.content);
    } else {
      setMessage('Error loading file');
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedFile || !content) {
      setMessage('Please select a file and add content');

      return;
    }

    setLoading(true);

    const fileData = await getFileContent(selectedFile);

    if (fileData) {
      const success = await updateFile(
        selectedFile,
        content,
        `Update ${selectedFile} via CMS`,
        fileData.sha
      );
      
      if (success) {
        setMessage('File updated successfully! Vercel will auto-deploy.');
      } else {
        setMessage('Error updating file');
      }
    }
    
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#000',
        color: '#fff'
      }}>
        <div style={{ 
          background: '#111', 
          padding: '2rem', 
          borderRadius: '8px',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>CMS Login</h1>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Master Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#222',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff'
                }}
                required
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#0070f3',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
          </form>
          {message && (
            <p style={{ 
              marginTop: '1rem', 
              textAlign: 'center',
              color: message.includes('successful') ? '#0f0' : '#f00'
            }}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000', 
      color: '#fff',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1>Sunrise Construction CMS</h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
          {/* File List */}
          <div style={{ backgroundColor: '#111', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Editable Files</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {files.map((file) => (
                <li key={file} style={{ marginBottom: '0.5rem' }}>
                  <button
                    onClick={() => handleFileSelect(file)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: selectedFile === file ? '#0070f3' : '#222',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {file.split('/').pop()}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Editor */}
          <div style={{ backgroundColor: '#111', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3>{selectedFile || 'Select a file to edit'}</h3>
              {selectedFile && (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: loading ? '#666' : '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Saving...' : 'Save & Deploy'}
                </button>
              )}
            </div>

            {selectedFile && (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  width: '100%',
                  height: '500px',
                  backgroundColor: '#222',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  padding: '1rem',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}
                placeholder="File content will appear here..."
              />
            )}
          </div>
        </div>

        {message && (
          <div style={{ 
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: message.includes('Error') ? '#dc3545' : '#28a745',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCMS;