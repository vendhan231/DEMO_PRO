class _MongoOnlyModel:
	pass


class User(_MongoOnlyModel):
	def __init__(self, *args, **kwargs):
		self.__dict__.update(kwargs)


class Book(_MongoOnlyModel):
	def __init__(self, *args, **kwargs):
		self.__dict__.update(kwargs)


class Cart(_MongoOnlyModel):
	def __init__(self, *args, **kwargs):
		self.__dict__.update(kwargs)


class CartItem(_MongoOnlyModel):
	def __init__(self, *args, **kwargs):
		self.__dict__.update(kwargs)


class Order(_MongoOnlyModel):
	def __init__(self, *args, **kwargs):
		self.__dict__.update(kwargs)


class OrderItem(_MongoOnlyModel):
	def __init__(self, *args, **kwargs):
		self.__dict__.update(kwargs)


__all__ = ["User", "Book", "Cart", "CartItem", "Order", "OrderItem"]
