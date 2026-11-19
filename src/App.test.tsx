import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the default structure with 13 folders in English', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Resolve Organizer' })).toBeInTheDocument()
    expect(screen.getByText('13 folders')).toBeInTheDocument()
    expect(screen.getByText('00_Footage/')).toBeInTheDocument()
  })

  it('switches the interface to German and remembers the choice', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Deutsch' }))
    expect(screen.getByRole('button', { name: 'Projekt erstellen' })).toBeInTheDocument()
    expect(window.localStorage.getItem('resolve-organizer-lang')).toBe('de')
  })

  it('adds a sibling bin through the dialog', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Add bin' }))
    const dialog = screen.getByRole('dialog')
    const input = within(dialog).getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Teste')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Teste/')).toBeInTheDocument()
    expect(screen.getByText('14 folders')).toBeInTheDocument()
  })

  it('shows an error and keeps the dialog open when the name is empty', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Add bin' }))
    const dialog = screen.getByRole('dialog')
    await user.clear(within(dialog).getByRole('textbox'))
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(within(dialog).getByText('Name cannot be empty.')).toBeInTheDocument()
    expect(screen.getByText('13 folders')).toBeInTheDocument()
  })

  it('asks for confirmation before removing the selected folder and its contents', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('02_Audio/'))
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/02_Audio/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }))
    expect(screen.queryByText('02_Audio/')).not.toBeInTheDocument()
    // 02_Audio had 3 children, so 13 - 4 = 9
    expect(screen.getByText('9 folders')).toBeInTheDocument()
  })

  it('asks for a project name before creating', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Create project' }))
    expect(screen.getByText('Enter the project name.')).toBeInTheDocument()
  })
})
