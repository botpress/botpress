import React from 'react'
import { Badge, Col, Grid, Panel, Row, Table, Tooltip as BTooltip, OverlayTrigger, Button, ListGroupItem, ListGroup, Glyphicon } from 'react-bootstrap';
import Filter from './filter'
import classnames from 'classnames'
import style from './style.scss'
import { Spring, Transition } from 'react-spring/renderprops'

//Registry Model { id: string, category: string, data: string, hitCount: number}
//Registry Category Model { category: string, expand: boolean, registryCount: number }

export default class RegistryBooksRoot extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      categoryList: null,
      dateBegin: null,
      dateEnd: null,
      showAll: false
    }
    this.modifyCategory = this.modifyCategory.bind(this)
    this.getCategory = this.getCategory.bind(this)
  }

  getCategory(categoryName) {
    const index = this.findCategoryIndexByCategory(categoryName);
    if (index == -1) {
      throw 'Category not found'
    }
    return { category: this.state.categoryList[index], index }
  }

  modifyCategory(categoryName, modifyObj) {
    let { category, index } = this.getCategory(categoryName)
    const categoryList = [...this.state.categoryList]
    category = { ...category, ...modifyObj }
    categoryList[index] = category
    this.setState({ categoryList });
  }

  updateCategoryList = async (dateBegin, dateEnd, showAll) => {
    await this.setState({ categoryList: "Loading categories" });
    try {
      const { data: { categories: categoryList } } = await this.props.bp.axios.get('/mod/registry-books/category', { params: { dateBegin, dateEnd, showAll } });
      categoryList.forEach((category) => {
        category.offset = 0;
      })
      await this.setState({ categoryList })
    } catch (error) {
      this.setState({ categoryList: "Failed to fetch categories" });
    }
  }

  updateCategory(categoryName, registry_count, offset) {
    const { dateBegin, dateEnd, showAll } = this.state
    this.props.bp.axios.get(`/mod/registry-books/category/${categoryName}?offset=${0}&limit=${(!offset ? 10 : (offset + 10))}`,
      { params: { dateBegin, dateEnd, showAll } })
      .then(({ data }) => {

        if (data.length < 1) {
          this.updateCategoryList(dateBegin, dateEnd, showAll);
        } else {
          this.modifyCategory(categoryName, { registries: data, registry_count, expand: true })
        }

      }).catch((error) => {
        this.setState({ categoryList: "Failed to fetch categories" });
      })
  }

  getList(category) {
    const { deleting, registries } = category;
    return registries.map((item) => {
      const { data_key, data, hit_count } = item;
      return (
        <tr key={data_key} style={{ height: 51 }}>
          <td>
            {data}
          </td>
          <td style={{ textAlign: "center" }}>
            {hit_count}
          </td>
          <td width="85">
            {!deleting ? <Button bsStyle="danger" onClick={this.clickExcluir.bind(this, item, category)}>Remove</Button> : null}
            {deleting == data_key ? <Glyphicon glyph="refresh" /> : null}
          </td>
        </tr>
      )
    })
  }

  //Delete registry
  clickExcluir(registry, category) {
    const { dateBegin, dateEnd, showAll: deleteAll } = this.state

    let confirm = false
    if (deleteAll) {
      confirm = window.confirm("Do you want to remove all the registries with the data bellow?\n" + registry.data)
    } else {
      confirm = window.confirm("Do you want to remove the registries with bellow?\nData:" + registry.data
        + '\nStored between ' + dateBegin + ' and ' + dateEnd + ' ?')
    }

    if (confirm) {
      this.modifyCategory(category.category, { deleting: registry.data_key })
      this.props.bp.axios.post('/mod/registry-books/registry/delete', { data_key: registry.data_key, dateBegin, dateEnd, deleteAll }).then(() => {
        this.modifyCategory(category.category, { deleting: undefined })
        this.updateCategory(category.category, category.registry_count - 1, category.offset);
      })
    }

  }

  findCategoryIndexByCategory(categoryToFind) {
    return this.state.categoryList.findIndex((category) => {
      return category.category == categoryToFind;
    })
  }

  //Show all registries from category
  clickExpand(categoryName) {
    this.modifyCategory(categoryName, { expand: 'loading' })
    const { dateBegin, dateEnd, showAll } = this.state
    this.props.bp.axios.get(`/mod/registry-books/category/${categoryName}?limit=10`,
      { params: { dateBegin, dateEnd, showAll } }).then(
        ({ data }) => {
          this.modifyCategory(categoryName, { registries: data, expand: true })
        }
      )
  }

  //Close category
  clickClose(categoryName) {
    this.modifyCategory(categoryName,
      {
        registries: [],
        expand: false,
        offset: undefined,
        loading_more: undefined,
        deleting: undefined
      })
  }

  clickShowMore(category) {
    //Show loading in the UI
    this.modifyCategory(category.category, { loading_more: true })

    //Fetch only the necessary data
    const { dateBegin, dateEnd, showAll } = this.state;
    const offset = category.offset == undefined ? 10 : category.offset + 10;
    this.props.bp.axios.get(`/mod/registry-books/category/${category.category}?offset=${offset}&limit=${10}`,
      { params: { dateBegin, dateEnd, showAll } }).then(
        ({ data }) => {
          const { category: newCategory } = this.getCategory(category.category)
          newCategory.registries = category.registries.concat(data);
          newCategory.loading_more = undefined;
          newCategory.offset = offset;
          this.modifyCategory(category.category, newCategory)
        }
      )
  }

  clickShowAll(category) {
    //Show loading in the UI
    this.modifyCategory(category.category, { loading_more: true })

    const { dateBegin, dateEnd, showAll } = this.state;
    this.props.bp.axios.get(`/mod/registry-books/category/${category.category}`,
      { params: { dateBegin, dateEnd, showAll } })
      .then(
        ({ data }) => {
          this.modifyCategory(category.category, { registries: data, offset: data.length, expand: true, loading_more: undefined })
        }
      )
  }

  renderCategory(category) {
    return (
      <Spring from={{ opacity: 0, maxHeight: 0 }} to={{ opacity: 1, maxHeight: 'none' }}>
        {props =>
          <div style={props}>
            <Table style={{ marginTop: "20px" }} striped bordered hover>
              <thead>
                <tr>
                  <td>Data</td>
                  <td width="30" >Hits</td>
                  <td width="10" >Action</td>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(category.registries) ? this.getList(category) : null}
              </tbody>
            </Table>
            {category.loading_more != true ? this.renderHelpers(category) : <div><Glyphicon glyph="refresh" /> Loading Registries </div>}
          </div>
        }
      </Spring>
    )
  }

  renderHelpers(category) {
    const shouldRender = category.registries.length < category.registry_count;
    return (
      <div>
        {shouldRender ? <Button bsStyle="default" onClick={this.clickShowMore.bind(this, category)}>Show More</Button> : null}
        {shouldRender ? <Button bsStyle="default" onClick={this.clickShowAll.bind(this, category)}>Show All</Button> : null}
      </div>
    )
  }

  getCategoryList() {
    const { categoryList } = this.state
    if (categoryList == null) return null
    if (typeof categoryList == 'string') return categoryList

    return categoryList.map((item) => {
      return (
        <ListGroupItem key={item.category} className={style.listgroupitem}>
          {item.category} <Badge> {item.registry_count} </Badge>
          {!item.expand
            ? <Button onClick={this.clickExpand.bind(this, item.category)} style={{ marginLeft: "10px" }}>Expand <Glyphicon glyph="resize-full" /></Button>
            : <Button onClick={this.clickClose.bind(this, item.category)} style={{ marginLeft: "10px" }}>Hide <Glyphicon glyph="resize-small" /></Button>}
          {item.expand == true ? this.renderCategory(item) : null}
          {item.expand == 'loading' ? <div className={style.loadindcategories}> <Glyphicon glyph="refresh" /> Loading </div> : null}
        </ListGroupItem>
      )
    })
  }

  renderCategoryList() {
    const list = this.getCategoryList();
    if (typeof list == 'string') {
      return <div> {list} </div>
    } else if (!Array.isArray(list)) {
      return "Perform a search"
    } else if (list.length < 1) {
      return "No registries found"
    }

    return (
      <Spring from={{ opacity: 0, marginLeft: -500 }} to={{ opacity: 1, marginLeft: 0 }}>
        {props =>
          <ListGroup style={props}>
            {this.getCategoryList()}
          </ListGroup>
        }
      </Spring>
    )
  }

  render() {

    return (
      <Panel className={classnames(style.rbContainer, 'rbContainer')}>
        <Filter
          parent={this}
          onClick={this.updateCategoryList.bind(this)}
          onChange={this.setState.bind(this, { categoryList: null })}
        />
        <Panel.Body className={classnames(style.result, 'result')}>
          {this.renderCategoryList()}
        </Panel.Body>
      </Panel>
    )
  }
}