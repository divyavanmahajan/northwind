import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // Since it redirects to /dashboard which might show loading or content, 
    // we just check if the document body exists for now as a smoke test
    expect(document.body).toBeTruthy();
  });
});
