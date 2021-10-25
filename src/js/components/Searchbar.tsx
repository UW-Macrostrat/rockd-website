import React, { Component } from 'react'
import TextField from '@material-ui/core/TextField'
import Grid from '@material-ui/core/Grid'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import WarningIcon from '@material-ui/icons/Warning'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import Paper from '@material-ui/core/Paper'
import List from '@material-ui/core/List'
import ListSubheader from '@material-ui/core/ListSubheader'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import FormHelperText from '@material-ui/core/FormHelperText'
import Switch from '@material-ui/core/Switch'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Tooltip from '@material-ui/core/Tooltip'
import Collapse from '@material-ui/core/Collapse'

const categoryTitles = {
  'lithology': 'Lithologies',
  'interval': 'Time Intervals',
  'place': 'Places (via Mapbox)',
  'strat_name': 'Stratigraphic Names',
  'environ': 'Environments (columns only)',
}

const sortOrder = {
  'interval': 1,
  'lithology': 2,
  'strat_name': 3,
  'environ': 4,
  'place': 5
}
class Searchbar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      inputFocused: false,
      searchTerm: ''
    }
    this.gainInputFocus = this.gainInputFocus.bind(this)
    this.loseInputFocus = this.loseInputFocus.bind(this)
    this.handleSearchInput = this.handleSearchInput.bind(this)
    this.addFilter = this.addFilter.bind(this)
  }

  gainInputFocus() {
    this.setState({
      inputFocused: true
    })
  }
  loseInputFocus() {
    // A slight timeout is required so that click actions can occur
    setTimeout(() => {
      this.setState({
        inputFocused: false
      })
    }, 100)
  }
  handleSearchInput(event) {
    this.setState({ searchTerm: event.target.value })
    if (event.target.value.length <= 2) {
      return
    }
    this.props.doSearch(event.target.value)
  }
  addFilter(f) {
    this.setState({
      searchTerm: ''
    })
    this.props.addFilter(f)
  }

  render() {
    const { toggleMenu, toggleFilters } = this.props
    let resultCategories = new Set(this.props.searchResults.map(d => { return d.category }))
    // Force the results into a particular order
    resultCategories = [...resultCategories].sort((a, b) => {
      return sortOrder[a] - sortOrder[b]
    })

    let categoryResults = resultCategories.map((cat) => {
      let thisCat = this.props.searchResults.filter(f => {
        if (f.category === cat) return f
      })
      return thisCat.map((item, h) => {
        return (<ListItem key={h} button onClick={() => { this.addFilter(item) }}>
          <ListItemText classes={{ 'root': 'searchresult-item' }} primary={item.name} disableTypography={true}/>
        </ListItem>)
      })
    })

    let searchResults = resultCategories.map((cat, i) => {
      return (<div key={`subheader-${i}`}>
          <ListSubheader classes={{ 'root': 'searchresult-header'}}>{categoryTitles[cat]}</ListSubheader>
          {categoryResults[i]}
        </div>)
    })

    let holderStyle = {
      margin: ((window.innerWidth < 850) && this.state.inputFocused) ? 0 : '20px'
    }

    let timeFilters = this.props.filters.filter(f => {
      if (f.category === 'interval') return f
    }).map(f => f.name)

    const otherFilters = this.props.filters.filter(f => {
      if (f.category !== 'interval') return f
    })
    const filters = (this.props.filters.length) ? (
      <Paper classes={{'root': 'filter-paper'}}>
        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} classes={{ 'root': 'searchbar-filter-container'}}>
            <span className="searchbar-filter-title">Filtering by:</span>
            <div className="filters">
              {otherFilters.length && timeFilters.length > 1 ? '(' : ''}
              {timeFilters.length ? timeFilters.join(' OR ') : ''}
              {otherFilters.length && timeFilters.length > 1 ? ')' : ''}

              {otherFilters.length && timeFilters.length ? ' AND ' : ''}

              {otherFilters.length > 1 && timeFilters.length ? '(' : ''}
              {otherFilters.map(f => f.name).join(' OR ')}
              {otherFilters.length > 1 && timeFilters.length ? ')' : ''}

            </div>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <List classes={{ 'root': 'filter-list'}}>
              <ListSubheader classes={{ 'root': 'searchresult-header'}}>Modify filters:</ListSubheader>
              {this.props.filters.map((d,i) => {
                return (<ListItem key={i}>
                  <Tooltip title="By default only 'best' lithology matches are shown. Toggle to show all matches or best.">
                    <FormControl className={d.category != 'lithology' ? 'hidden': ''}>
                    <FormControlLabel
                        control={
                          <Switch
                            checked={d.type.substr(0,4) === 'all_' ? true : false}
                            onChange={() => { this.props.swapLithType(d) }}
                          />
                        }
                        label={d.type.substr(0,4) === 'all_' ? 'All matches' : 'Best matches'}
                      />
                      
                    </FormControl>
                  </Tooltip>
                  
                  <ListItemText primary={d.name}/>
                  <ListItemSecondaryAction onClick={() => { this.props.removeFilter(d) }}>
                    <IconButton color="secondary" aria-label="remove" >
                      <RemoveCircleOutlineIcon/>
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>)
              })}
            </List>
          </ExpansionPanelDetails>
        </ExpansionPanel>

      </Paper>
    ) : ''

    return (
      <div className="searchbar-holder" style={holderStyle}>
        <Grid container>
          <Grid item xs={12} sm={7} md={6} lg={4} xl={3}>
            <Paper>
              <Toolbar className="searchbar-background">
                  <IconButton color="default" aria-label="Menu" onClick={toggleMenu}>
                    <MenuIcon />
                  </IconButton>
                  <input
                    className="search-input"
                    type="text"
                    placeholder="Search Macrostrat"
                    onFocus={this.gainInputFocus}
                    onBlur={this.loseInputFocus}
                    onChange={this.handleSearchInput}
                    value={this.state.searchTerm}
                  />
              </Toolbar>
              <Collapse in={this.state.inputFocused} timeout="auto" unmountOnExit className="search-results">
                <div>
                  <List className={this.state.searchTerm.length != 0 ? 'hidden' : 'search-results'} dense={true}>
                    <ListItem>
                      <ListItemText primary="Available categories:" />
                    </ListItem>
                    <ListItem>
                      <ListItemText inset primary="Time intervals" />
                    </ListItem>
                    <ListItem>
                      <ListItemText inset primary="Lithologies" />
                    </ListItem>
                    <ListItem>
                      <ListItemText inset primary="Stratigraphic Names" />
                    </ListItem>
                    <ListItem>
                      <ListItemText inset primary="Environments (columns only)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText inset primary="Places" />
                    </ListItem>
                  </List>
                  <List className={this.state.searchTerm.length < 3 ? 'hidden' : 'search-results'}>
                    {this.props.searchResults && this.props.searchResults.length ?
                      searchResults
                      : ''
                    }
                  </List>
                </div>
              </Collapse>
            </Paper>
            { filters }
          </Grid>
        </Grid>

      </div>
    )
  }
}

export default Searchbar
