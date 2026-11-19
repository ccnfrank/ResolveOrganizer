import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the default bin graph with 13 folders in English', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Resolve Organizer' })).toBeInTheDocument()
    expect(screen.getByText('00_Footage')).toBeInTheDocument()
    expect(screen.getByText('07_Renders')).toBeInTheDocument()
  })

  it('switches the interface to German and remembers the choice', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Deutsch' }))
    expect(screen.getByRole('button', { name: /Projekt rendern/ })).toBeInTheDocument()
    expect(window.localStorage.getItem('resolve-organizer-lang')).toBe('de')
  })

  it('adds a bin through the dialog', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Add bin' }))
    const dialog = screen.getByRole('dialog')
    const input = within(dialog).getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Teste')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Teste')).toBeInTheDocument()
  })

  it('shows an error and keeps the dialog open when the name is empty', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Add bin' }))
    const dialog = screen.getByRole('dialog')
    await user.clear(within(dialog).getByRole('textbox'))
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(within(dialog).getByText('Name cannot be empty.')).toBeInTheDocument()
    expect(screen.queryByText('Teste')).not.toBeInTheDocument()
  })

  it('asks for confirmation before removing the selected bin and its contents', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /02_Audio/ }))
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/02_Audio/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }))
    expect(screen.queryByText('02_Audio')).not.toBeInTheDocument()
    // Its children go with it
    expect(screen.queryByText('VO')).not.toBeInTheDocument()
    expect(screen.getByText('03_Assets')).toBeInTheDocument()
  })

  it('asks for a project name before rendering', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Render project/ }))
    expect(screen.getByText('Enter the project name.')).toBeInTheDocument()
  })

  it('does not show a numbering warning on the default structure', () => {
    render(<App />)
    expect(screen.queryByText(/Repeated numbering/)).not.toBeInTheDocument()
  })

  it('undoes a removal with Ctrl+Z and redoes it with Ctrl+Shift+Z', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /07_Renders/ }))
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove' }))
    expect(screen.queryByText('07_Renders')).not.toBeInTheDocument()

    await user.keyboard('{Control>}z{/Control}')
    expect(screen.getByText('07_Renders')).toBeInTheDocument()

    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}')
    expect(screen.queryByText('07_Renders')).not.toBeInTheDocument()
  })

  it('applies the Documentary model as a whole structure', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Documentary' }))
    expect(screen.getByText('04_Pesquisa')).toBeInTheDocument()
    expect(screen.queryByText('04_Imagens')).not.toBeInTheDocument()
  })
})
